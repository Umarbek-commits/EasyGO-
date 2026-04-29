class UserRole:
    CLIENT = "client"
    DRIVER = "driver"
    ADMIN = "admin"


class DriverStatus:
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"


class RideStatus:
    SEARCHING = "searching"
    DRIVER_FOUND = "driver_found"
    DRIVER_ARRIVING = "driver_arriving"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"