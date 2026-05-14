print("WS FILE LOADED")
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter()

# Хранилище активных WebSocket соединений
class ConnectionManager:
    def __init__(self):
        # Храним водителей: {user_id: websocket}
        self.active_drivers: Dict[str, WebSocket] = {}
        # Храним клиентов: {user_id: websocket}
        self.active_clients: Dict[str, WebSocket] = {}

    async def connect_driver(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_drivers[user_id] = websocket
        print(f"Driver {user_id} connected. Total drivers: {len(self.active_drivers)}")

    async def connect_client(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_clients[user_id] = websocket
        print(f"Client {user_id} connected. Total clients: {len(self.active_clients)}")

    def disconnect_driver(self, user_id: str):
        if user_id in self.active_drivers:
            del self.active_drivers[user_id]
            print(f"Driver {user_id} disconnected. Total drivers: {len(self.active_drivers)}")

    def disconnect_client(self, user_id: str):
        if user_id in self.active_clients:
            del self.active_clients[user_id]
            print(f"Client {user_id} disconnected. Total clients: {len(self.active_clients)}")

    async def send_to_driver(self, user_id: str, message: dict):
        if user_id in self.active_drivers:
            try:
                await self.active_drivers[user_id].send_json(message)
                return True
            except:
                self.disconnect_driver(user_id)
                return False
        return False

    async def broadcast_to_drivers(self, message: dict):
        disconnected = []
        for user_id, websocket in self.active_drivers.items():
            try:
                await websocket.send_json(message)
            except:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            self.disconnect_driver(user_id)
        
        return len(self.active_drivers)

    async def broadcast_to_clients(self, message: dict):
        disconnected = []
        for user_id, websocket in self.active_clients.items():
            try:
                await websocket.send_json(message)
            except:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            self.disconnect_client(user_id)
        
        return len(self.active_clients)

    async def send_to_client(self, user_id: int, message: dict):
        if user_id in self.active_clients:
            try:
                await self.active_clients[user_id].send_json(message)
                return True
            except:
                self.disconnect_client(user_id)
                return False
        return False


manager = ConnectionManager()


@router.websocket("/ws/driver/{user_id}")
async def websocket_driver_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect_driver(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Message from driver {user_id}: {data}")
            # Обработка сообщений от водителя
            try:
                message = json.loads(data)
                if message.get("type") == "location":
                    # Обновление геолокации водителя
                    lat = message.get("lat")
                    lng = message.get("lng")
                    print(f"Driver {user_id} location: {lat}, {lng}")
                    
                    # Отправляем обновление клиенту, если у него есть активный заказ с этим водителем
                    # Здесь можно добавить логику для отправки геолокации конкретному клиенту
                    await manager.broadcast_to_clients({
                        "type": "driver_location",
                        "driver_id": user_id,
                        "lat": lat,
                        "lng": lng,
                    })
            except json.JSONDecodeError:
                print(f"Invalid JSON from driver {user_id}: {data}")
            except Exception as e:
                print(f"Error processing driver message: {e}")
    except WebSocketDisconnect:
        manager.disconnect_driver(user_id)
    except Exception as e:
        print(f"Unexpected error in driver endpoint: {e}")
        manager.disconnect_driver(user_id)


@router.websocket("/ws/client/{user_id}")
async def websocket_client_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect_client(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Message from client {user_id}: {data}")
            # Обработка сообщений от клиента
            try:
                message = json.loads(data)
                if message.get("type") == "track_driver":
                    driver_id = message.get("driver_id")
                    print(f"Client {user_id} wants to track driver {driver_id}")
                    # Здесь можно сохранить соответствие клиент -> водитель
            except json.JSONDecodeError:
                print(f"Invalid JSON from client {user_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect_client(user_id)
    except Exception as e:
        print(f"Unexpected error in client endpoint: {e}")
        manager.disconnect_client(user_id)


# Функция для отправки нового заказа всем водителям
async def broadcast_new_ride(ride_data: dict):
    message = {
        "type": "new_ride",
        "ride_id": ride_data.get("id"),
        "pickup": ride_data.get("pickup_address"),
        "dropoff": ride_data.get("dropoff_address"),
        "pickup_lat": ride_data.get("pickup_lat"),
        "pickup_lng": ride_data.get("pickup_lng"),
        "dropoff_lat": ride_data.get("dropoff_lat"),
        "dropoff_lng": ride_data.get("dropoff_lng"),
        "price": ride_data.get("estimated_price", 120),
    }
    count = await manager.broadcast_to_drivers(message)
    print(f"Broadcasted new ride to {count} drivers")
    return count


# Функция для отправки местоположения водителя конкретному клиенту
async def send_driver_location_to_client(client_id: int, driver_id: int, lat: float, lng: float):
    message = {
        "type": "driver_location",
        "driver_id": driver_id,
        "lat": lat,
        "lng": lng,
    }
    success = await manager.send_to_client(client_id, message)
    return success
print(router.routes)