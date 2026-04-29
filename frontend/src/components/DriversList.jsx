export default function DriversList({ drivers, onSelect }) {
  return (
    <div className="drivers-list">
      {drivers.map((driver) => (
        <div 
          key={driver.id} 
          className="driver-card"
          onClick={() => onSelect(driver)}
        >
          <h3>{driver.name}</h3>
          <p>{driver.car}</p>
          <p>{driver.price} сом</p>
          <p>{driver.time} мин</p>
        </div>
      ))}
    </div>
  )
}