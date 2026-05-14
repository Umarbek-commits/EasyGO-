import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import {
  createRide,
  getCurrentRide,
  cancelCurrentRide,
  searchPlaces,
  geocodePlace,
  reverseGeocodePlace,
  searchMatchingDrivers,
} from "../api/client";
import { searchBishkekStreets } from "../data/bishkekStreets";
import searchIcon from "../assets/Icon/search.svg";
import carIcon from "../assets/Icon/car.svg";
import paymentIcon from "../assets/Icon/payment.svg";
import locationIcon from "../assets/Icon/location.svg";
import currentLocationIcon from "../assets/Icon/location.svg";
import phoneIcon from "../assets/Icon/phone.svg";
import chatIcon from "../assets/Icon/chat.svg";
import LiveMapboxMap from "../components/LiveMapboxMap";
import currentLocationIcon2 from "../assets/Icon/current-location.png";
import DriversList from "../components/DriversList";

function HomePage() {
  const navigate = useNavigate();
  const dropoffSearchTimeoutRef = useRef(null);

  const [isRideSheetOpen, setIsRideSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDriverFound, setIsDriverFound] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [seconds, setSeconds] = useState(1);
  const [error, setError] = useState("");

  const [pickup, setPickup] = useState("Bishkek, Toktogul 1");
  const [dropoff, setDropoff] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState({
    lat: null,
    lng: null,
  });
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [isSearchingDropoff, setIsSearchingDropoff] = useState(false);
  const [isDropoffFocused, setIsDropoffFocused] = useState(false);

  const [currentRide, setCurrentRide] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);

  const [isTripStartedMock, setIsTripStartedMock] = useState(false);
  const [matchedDrivers, setMatchedDrivers] = useState([]);
  const [isSelectingDriver, setIsSelectingDriver] = useState(false);

  // Состояния для списка водителей (управляются из MapboxSearchInput или другого компонента)
  const [drivers, setDrivers] = useState([]);
  const [showDrivers, setShowDrivers] = useState(false);

  // Состояние для отслеживания местоположения водителя через WebSocket
  const [driverLocation, setDriverLocation] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("easygo_user") || "null");
    } catch {
      return null;
    }
  }, []);

  // WebSocket для получения местоположения водителя
  useEffect(() => {
    const token = localStorage.getItem("easygo_token");
    if (!token) return;

   const WS_URL =
  window.location.hostname === "localhost"
    ? "ws://localhost:8000"
    : "wss://easygo-ao7f.onrender.com";

   const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected as client");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        if (data.type === "driver_location") {
          setDriverLocation({
            lat: data.lat,
            lng: data.lng,
          });
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    const token = localStorage.getItem("easygo_token");
    if (!token) return;

    const restoreRide = async () => {
      try {
        const data = await getCurrentRide();

        if (data?.ride) {
          setCurrentRide(data.ride);
          setMatchedDrivers([]);

          if (data.ride.status === "searching") {
            setIsSearching(true);
            setIsDriverFound(false);
            setIsTripStartedMock(false);
          } else if (
            data.ride.status === "driver_found" ||
            data.ride.status === "accepted" ||
            data.ride.status === "arrived"
          ) {
            setIsSearching(false);
            setIsDriverFound(true);
            setIsTripStartedMock(false);
          } else if (data.ride.status === "in_progress") {
            setIsSearching(false);
            setIsDriverFound(false);
            setIsTripStartedMock(false);
          } else {
            setIsSearching(false);
            setIsDriverFound(false);
            setIsTripStartedMock(false);
          }
        } else {
          setCurrentRide(null);
          setIsSearching(false);
          setIsDriverFound(false);
          setIsTripStartedMock(false);
        }
      } catch (err) {
        console.error("restore ride error", err);
      }
    };

    restoreRide();
  }, []);

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    const shouldPoll =
      !!currentRide &&
      (isDriverFound ||
        isTripStartedMock ||
        currentRide?.status === "searching" ||
        currentRide?.status === "driver_found" ||
        currentRide?.status === "accepted" ||
        currentRide?.status === "arrived" ||
        currentRide?.status === "in_progress");

    if (!shouldPoll) return;

    const token = localStorage.getItem("easygo_token");
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const data = await getCurrentRide();

        if (data?.ride) {
          setCurrentRide(data.ride);

          if (data.ride.status === "searching") {
            setIsSearching(true);
            setIsDriverFound(false);
            setIsTripStartedMock(false);
          } else if (
            data.ride.status === "driver_found" ||
            data.ride.status === "accepted" ||
            data.ride.status === "arrived"
          ) {
            setIsSearching(false);
            setIsDriverFound(true);
          } else if (data.ride.status === "in_progress") {
            setIsSearching(false);
            setIsDriverFound(false);
            setIsTripStartedMock(false);
          } else {
            setIsSearching(false);
            setIsDriverFound(false);
            if (data.ride.status !== "in_progress") {
              setIsTripStartedMock(false);
            }
          }
        } else {
          setCurrentRide(null);
          setIsSearching(false);
          setIsDriverFound(false);
          setIsTripStartedMock(false);
        }
      } catch (err) {
        console.error("getCurrentRide error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentRide, isDriverFound, isTripStartedMock]);

  useEffect(() => {
    if (!isRideSheetOpen) {
      setDropoffSuggestions([]);
      setIsDropoffFocused(false);

      if (dropoffSearchTimeoutRef.current) {
        clearTimeout(dropoffSearchTimeoutRef.current);
      }
    }
  }, [isRideSheetOpen]);

  useEffect(() => {
    if (!isRideSheetOpen) return;

    const query = dropoff.trim();

    if (dropoffSearchTimeoutRef.current) {
      clearTimeout(dropoffSearchTimeoutRef.current);
    }

    if (query.length < 2) {
      setDropoffSuggestions([]);
      setIsSearchingDropoff(false);
      return;
    }

    dropoffSearchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearchingDropoff(true);

        const localSuggestions = searchBishkekStreets(query, 8);

        if (localSuggestions.length > 0) {
          setDropoffSuggestions(localSuggestions);
          return;
        }

        const data = await searchPlaces(`${query}, Бишкек, Кыргызстан`);
        setDropoffSuggestions(data?.suggestions || []);
      } catch (err) {
        console.error("searchPlaces error", err);
        setDropoffSuggestions([]);
      } finally {
        setIsSearchingDropoff(false);
      }
    }, 320);

    return () => {
      if (dropoffSearchTimeoutRef.current) {
        clearTimeout(dropoffSearchTimeoutRef.current);
      }
    };
  }, [dropoff, isRideSheetOpen]);

  async function handleDetectLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается на этом устройстве.");
      return;
    }

    try {
      setIsLocating(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const nextLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            setUserLocation(nextLocation);

            const reverseResult = await reverseGeocodePlace(
              nextLocation.lat,
              nextLocation.lng
            );

            if (reverseResult?.name) {
              setPickup(reverseResult.name);
            } else {
              setPickup("Моё местоположение");
            }
          } catch (reverseError) {
            console.error("reverse geocode error:", reverseError);
            setPickup("Моё местоположение");
          } finally {
            setIsLocating(false);
          }
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          setError("Не удалось определить местоположение. Разрешите доступ к геолокации.");
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 12000,
        }
      );
    } catch (err) {
      console.error("handleDetectLocation error", err);
      setError("Не удалось определить местоположение.");
      setIsLocating(false);
    }
  }

  function formatSuggestion(item) {
    const raw = item?.name || item?.shortName || "";
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return {
        title: "",
        subtitle: item?.subtitle || "Бишкек, Кыргызстан",
      };
    }

    const first = parts[0] || "";
    const second = parts[1] || "";
    const rest = parts.slice(2).join(", ");

    const secondLooksLikeHouse = /^\d+[A-Za-zА-Яа-я/-]*$/.test(second);

    if (secondLooksLikeHouse) {
      return {
        title: `${first}, ${second}`,
        subtitle: rest || item?.subtitle || "Бишкек, Кыргызстан",
      };
    }

    return {
      title: first,
      subtitle: item?.subtitle || parts.slice(1).join(", ") || "Бишкек, Кыргызстан",
    };
  }

  function handleSelectDropoff(suggestion) {
    const formatted = formatSuggestion(suggestion);

    setDropoff(formatted.title || suggestion.name);
    setDropoffCoords({
      lat: suggestion.lat ?? null,
      lng: suggestion.lng ?? null,
    });
    setDropoffSuggestions([]);
    setIsDropoffFocused(false);
    setError("");
  }

  async function resolveDropoffAddress() {
    let finalDropoffCoords = dropoffCoords;
    let finalDropoffText = dropoff.trim();

    if (!finalDropoffText) {
      return { error: "Введите адрес назначения" };
    }

    if (finalDropoffCoords?.lat && finalDropoffCoords?.lng) {
      return {
        finalDropoffCoords,
        finalDropoffText,
      };
    }

    const localMatch = searchBishkekStreets(finalDropoffText, 1)?.[0];

    try {
      if (localMatch?.name) {
        const localQuery = `${localMatch.name}, Бишкек, Кыргызстан`;
        const localResult = await geocodePlace(localQuery);

        if (localResult?.lat && localResult?.lng) {
          finalDropoffCoords = {
            lat: localResult.lat,
            lng: localResult.lng,
          };
          finalDropoffText = localResult.name || localMatch.name;

          setDropoff(finalDropoffText);
          setDropoffCoords(finalDropoffCoords);

          return {
            finalDropoffCoords,
            finalDropoffText,
          };
        }
      }

      const fallbackResult = await geocodePlace(`${finalDropoffText}, Бишкек, Кыргызстан`);

      if (fallbackResult?.lat && fallbackResult?.lng) {
        finalDropoffCoords = {
          lat: fallbackResult.lat,
          lng: fallbackResult.lng,
        };
        finalDropoffText = fallbackResult.name || finalDropoffText;

        setDropoff(finalDropoffText);
        setDropoffCoords(finalDropoffCoords);

        return {
          finalDropoffCoords,
          finalDropoffText,
        };
      }

      return { error: "Не удалось найти этот адрес" };
    } catch (err) {
      console.error("resolve dropoff error", err);
      return { error: "Ошибка поиска адреса" };
    }
  }

  async function handleStartSearch() {
    const token = localStorage.getItem("easygo_token");
    setError("");

    if (!token) {
      navigate("/");
      return;
    }

    if (!user || user.role !== "client") {
      setError("Искать машину может только клиент.");
      return;
    }

    if (!userLocation?.lat || !userLocation?.lng) {
      setError("Сначала нажмите «Моё местоположение».");
      return;
    }

    if (!dropoff.trim()) {
      setError("Введите адрес назначения");
      return;
    }

    const resolved = await resolveDropoffAddress();

    if (resolved?.error) {
      setError(resolved.error);
      return;
    }

    const { finalDropoffCoords } = resolved;

    try {
      setIsSearching(true);
      setMatchedDrivers([]);
      setCurrentRide(null);
      setIsDriverFound(false);
      setIsCancelConfirmOpen(false);
      setIsTripStartedMock(false);
      setSeconds(1);

      const data = await searchMatchingDrivers({
        pickup_lat: userLocation.lat,
        pickup_lng: userLocation.lng,
        dropoff_lat: finalDropoffCoords.lat,
        dropoff_lng: finalDropoffCoords.lng,
      });

      setIsSearching(false);

      if (data?.drivers?.length) {
        setIsRideSheetOpen(false);
        setMatchedDrivers(data.drivers);
      } else {
        setError("Нет подходящих машин рядом");
      }
    } catch (err) {
      console.error("searchMatchingDrivers error", err);
      setIsSearching(false);
      setError("Ошибка поиска машин");
    }
  }

  function handleStopSearch() {
    setIsSearching(false);
    setSeconds(1);
    setMatchedDrivers([]);
  }

  async function handleSelectDriver(driverItem) {
    if (!userLocation?.lat || !userLocation?.lng) {
      setError("Сначала определите местоположение");
      return;
    }

    const resolved = await resolveDropoffAddress();

    if (resolved?.error) {
      setError(resolved.error);
      return;
    }

    const { finalDropoffCoords, finalDropoffText } = resolved;

    try {
      setIsSelectingDriver(true);
      setError("");

      const data = await createRide({
        driver_id: driverItem.driver_id,
        pickup_address: pickup || "Моё местоположение",
        dropoff_address: finalDropoffText,
        pickup_lat: userLocation.lat,
        pickup_lng: userLocation.lng,
        dropoff_lat: finalDropoffCoords.lat,
        dropoff_lng: finalDropoffCoords.lng,
        payment_method: "cash",
      });

      if (data?.ok) {
        setCurrentRide(data.ride || null);
        setMatchedDrivers([]);
        setIsRideSheetOpen(false);
        setIsDriverFound(
          data?.ride?.status === "driver_found" ||
            data?.ride?.status === "accepted" ||
            data?.ride?.status === "arrived"
        );
        setIsSearching(data?.ride?.status === "searching");
        setSeconds(1);
      } else {
        setError(data?.detail || "Ошибка выбора машины");
      }
    } catch (err) {
      console.error("handleSelectDriver error", err);
      setError("Ошибка выбора машины");
    } finally {
      setIsSelectingDriver(false);
    }
  }

  function handleMockTripStart() {
    setIsTripStartedMock(true);
    setIsDriverFound(false);
    setIsSearching(false);
    setIsCancelConfirmOpen(false);
  }

  async function handleConfirmCancelRide() {
    try {
      setIsCancellingRide(true);
      setError("");

      await cancelCurrentRide();

      setIsCancelConfirmOpen(false);
      setIsDriverFound(false);
      setIsSearching(false);
      setIsRideSheetOpen(false);
      setSeconds(1);
      setCurrentRide(null);
      setIsTripStartedMock(false);
      setMatchedDrivers([]);
    } catch (err) {
      console.error("cancel ride error", err);
      setError("Не удалось отменить поездку");
    } finally {
      setIsCancellingRide(false);
    }
  }

  function formatTime(totalSeconds) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function getDistanceMeters(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
      return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  function getProgressStep(status) {
    if (status === "in_progress") return 3;
    if (status === "arrived") return 2;
    if (status === "driver_found" || status === "accepted") return 1;
    return 0;
  }

  function renderRideProgress(status) {
    const currentStep = getProgressStep(status);

    const steps = [
      { key: 1, label: "Едет" },
      { key: 2, label: "На месте" },
      { key: 3, label: "В пути" },
    ];

    return (
      <div className="ride-progress">
        {steps.map((step, index) => {
          const isActive = currentStep >= step.key;

          return (
            <div className="ride-progress-item" key={step.key}>
              <span
                className={`ride-progress-label ${isActive ? "is-active" : ""}`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`ride-progress-line ${currentStep > step.key ? "is-active" : ""}`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const ridePickupLat = currentRide?.pickup_lat ?? userLocation?.lat ?? null;
  const ridePickupLng = currentRide?.pickup_lng ?? userLocation?.lng ?? null;

  const rideDropoffLat = currentRide?.dropoff_lat ?? dropoffCoords?.lat ?? null;
  const rideDropoffLng = currentRide?.dropoff_lng ?? dropoffCoords?.lng ?? null;
  const rideDropoffAddress =
    currentRide?.dropoff_address || dropoff || "Место назначения";

  // Используем driverLocation из WebSocket, если доступен, иначе из currentRide
  const finalDriverLat = driverLocation?.lat ?? currentRide?.driver?.current_lat ?? matchedDrivers?.[0]?.lat ?? null;
  const finalDriverLng = driverLocation?.lng ?? currentRide?.driver?.current_lng ?? matchedDrivers?.[0]?.lng ?? null;

  const rideStatus = currentRide?.status || null;

  const driverDistanceToPickup = getDistanceMeters(
    finalDriverLat,
    finalDriverLng,
    ridePickupLat,
    ridePickupLng
  );

  const isActuallyNearPickup =
    driverDistanceToPickup != null && driverDistanceToPickup <= 60;

  const isTripInProgress = rideStatus === "in_progress" || isTripStartedMock;

  const isDriverArrived =
    rideStatus === "arrived" && isActuallyNearPickup && !isTripInProgress;

  const isDriverFoundSheetVisible =
    !!currentRide && isDriverFound && !isDriverArrived && !isTripInProgress;

  const isMatchesVisible =
    matchedDrivers.length > 0 &&
    !currentRide &&
    !isSearching &&
    !isDriverFound &&
    !isTripInProgress;

  const driver = currentRide?.driver || null;
  const driverName = driver?.first_name || "Водитель";
  const driverRating = driver?.rating_avg
    ? `Рейтинг ${Number(driver.rating_avg).toFixed(1)}/5`
    : "Рейтинг 5/5";
  const driverCar = driver
    ? `${driver.car_color || ""} ${driver.car_model || ""}`.trim()
    : "Машина не указана";
  const driverPlate = driver?.car_number || "XXXXXXX";
  const etaMin = currentRide?.eta_min || driver?.eta_min || 4;
  const tripEtaMin =
    currentRide?.trip_eta_min ||
    currentRide?.eta_to_dropoff_min ||
    currentRide?.estimated_duration_min ||
    8;

  const progressStatus = isTripInProgress
    ? "in_progress"
    : isDriverArrived
    ? "arrived"
    : isDriverFoundSheetVisible
    ? "driver_found"
    : null;

  const isOverlayDark =
    isRideSheetOpen ||
    isSearching ||
    isDriverFound ||
    isCancelConfirmOpen ||
    isTripInProgress ||
    isMatchesVisible;

  return (
    <MobileShell
      activeTab="map"
      showBottomNav={
        !isRideSheetOpen &&
        !isSearching &&
        !isDriverFound &&
        !isCancelConfirmOpen &&
        !isTripInProgress &&
        !isMatchesVisible
      }
    >
      <div className="home-screen">
        <div className="home-map-wrap">
          <LiveMapboxMap
            pickupLat={ridePickupLat}
            pickupLng={ridePickupLng}
            dropoffLat={rideDropoffLat}
            dropoffLng={rideDropoffLng}
            driverLat={finalDriverLat}
            driverLng={finalDriverLng}
            matchedDrivers={matchedDrivers}
            darkOverlay={isOverlayDark}
          />

          {!isRideSheetOpen &&
            !isSearching &&
            !isDriverFound &&
            !isCancelConfirmOpen &&
            !isTripInProgress &&
            !isMatchesVisible && (
              <button
                type="button"
                className={`map-location-fab ${isLocating ? "is-loading" : ""}`}
                onClick={handleDetectLocation}
                disabled={isLocating}
                aria-label="Определить местоположение"
                title="Определить местоположение"
              >
                <img
                  src={currentLocationIcon}
                  alt=""
                  className="map-location-fab-icon"
                />
              </button>
            )}
        </div>

        <div className="home-overlay">
          <div className="top-brand map-brand">
            <span className="brand-black">Easy</span>
            <span className="brand-purple">GO!</span>
          </div>

          <div className="promo-card">
            <div className="promo-title">Скидка 20% на первую поездку</div>
            <div className="promo-code">EASYGO25</div>
          </div>

          {!isRideSheetOpen &&
            !isSearching &&
            !isDriverFound &&
            !isCancelConfirmOpen &&
            !isTripInProgress &&
            !isMatchesVisible && (
              <div className="search-ride-wrap">
                <button
                  type="button"
                  className="ride-search-btn"
                  onClick={() => {
                    setMatchedDrivers([]);
                    setIsRideSheetOpen(true);
                  }}
                >
                  <span className="ride-search-icon-wrap">
                    <img
                      src={searchIcon}
                      alt="search"
                      className="ride-search-icon-img"
                    />
                  </span>
                  <span className="ride-search-text">Куда едем?</span>
                </button>
              </div>
            )}

          {isRideSheetOpen && (
            <>
              <div
                className="sheet-backdrop"
                onClick={() => setIsRideSheetOpen(false)}
              />
              <div className="ride-sheet">
                <div className="sheet-handle" />
                <h2 className="ride-sheet-title">Куда едем?</h2>

                <div className="ride-form-group">
                  <label className="ride-label">Откуда</label>
                  <div className="ride-input-box">
                    <button
                      type="button"
                      className="ride-input-icon ride-input-icon-btn"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      title="Определить местоположение"
                    >
                      <img
                        src={currentLocationIcon2}
                        alt=""
                        className="ride-input-icon-img"
                      />
                    </button>
                    <input
                      className="ride-input"
                      placeholder="Ваше местоположение"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ride-form-group">
                  <label className="ride-label">Куда</label>
                  <div className="ride-input-search-wrap">
                    <div className="ride-input-box">
                      <span className="ride-input-icon">
                        <img
                          src={locationIcon}
                          alt=""
                          className="ride-input-icon-img"
                        />
                      </span>
                      <input
                        className="ride-input"
                        placeholder="Введите улицу или адрес"
                        value={dropoff}
                        onChange={(e) => {
                          setDropoff(e.target.value);
                          setDropoffCoords({ lat: null, lng: null });
                          setIsDropoffFocused(true);
                          setError("");
                        }}
                        onFocus={() => setIsDropoffFocused(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setIsDropoffFocused(false);
                          }, 180);
                        }}
                      />
                    </div>

                    {isDropoffFocused &&
                      (isSearchingDropoff ||
                        dropoffSuggestions.length > 0 ||
                        dropoff.trim().length >= 2) && (
                        <div className="ride-suggestions">
                          {isSearchingDropoff && (
                            <div className="ride-suggestion-empty">
                              Ищем адрес...
                            </div>
                          )}

                          {!isSearchingDropoff &&
                            dropoffSuggestions.map((item) => {
                              const formatted = formatSuggestion(item);

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className="ride-suggestion-item"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectDropoff(item)}
                                >
                                  <span className="ride-suggestion-dot" />
                                  <span className="ride-suggestion-content">
                                    <span className="ride-suggestion-title">
                                      {formatted.title}
                                    </span>
                                    <span className="ride-suggestion-subtitle">
                                      {formatted.subtitle}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}

                          {!isSearchingDropoff &&
                            dropoff.trim().length >= 2 &&
                            dropoffSuggestions.length === 0 && (
                              <div className="ride-suggestion-empty">
                                Ничего не найдено
                              </div>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                <button type="button" className="payment-btn">
                  <span className="payment-icon">
                    <img src={paymentIcon} alt="" className="payment-icon-img" />
                  </span>
                  <span className="payment-info">
                    <span className="payment-title">Способ оплаты</span>
                    <span className="payment-subtitle">Карта</span>
                  </span>
                </button>

                {error ? <div className="error-text">{error}</div> : null}

                <button
                  type="button"
                  className="find-car-btn"
                  onClick={handleStartSearch}
                >
                  <span className="find-car-icon">
                    <img src={carIcon} alt="" className="find-car-icon-img" />
                  </span>
                  <span>Искать машину</span>
                </button>
              </div>
            </>
          )}

          {isSearching && (
            <div className="searching-sheet compact-sheet">
              <div className="sheet-handle" />
              <h2 className="searching-title">
                Поиск машины {formatTime(seconds)}
              </h2>
              <p className="searching-subtitle">
                Смотрим подходящие машины по вашему маршруту
              </p>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleStopSearch}
              >
                <span className="cancel-icon">
                  <span className="cancel-x">✖</span>
                </span>
                <span className="cancel-text">Отмена</span>
              </button>
            </div>
          )}

          {isMatchesVisible && (
            <div className="driver-found-sheet compact-sheet">
              <div className="sheet-handle" />

              <h2 className="driver-found-title compact-title">
                Подходящие машины
              </h2>

              <p className="searching-subtitle" style={{ marginBottom: 12 }}>
                Выберите машину, которая уже рядом и едет примерно в ту же сторону
              </p>

              {matchedDrivers.map((item) => (
                <div key={item.driver_id} className="match-card">
                  <div className="match-header">
                    <span className="match-name">
                      {item.name || "Водитель"}
                    </span>
                    <span className="match-badge">
                      {Math.round(item.score)}%
                    </span>
                  </div>
                  <div className="match-car">
                    {item.car || "Машина не указана"}
                  </div>
                  <div className="match-plate">
                    {item.plate || "XXXXXXX"}
                  </div>
                  <div className="match-meta">
                    <span>{item.distance_km} км</span>
                    <span>~ {item.eta_min} мин</span>
                  </div>
                  <button
                    className="match-btn"
                    onClick={() => handleSelectDriver(item)}
                    disabled={isSelectingDriver}
                  >
                    {isSelectingDriver ? "..." : "Выбрать"}
                  </button>
                </div>
              ))}
              <div className="driver-actions">
                <button
                  type="button"
                  className="driver-cancel-btn secondary-cancel-btn"
                  onClick={() => setMatchedDrivers([])}
                >
                  <span className="driver-cancel-icon">
                    <span className="driver-cancel-x">✕</span>
                  </span>
                  <span className="driver-cancel-text">Закрыть</span>
                </button>
              </div>
            </div>
          )}

          {isDriverFoundSheetVisible && (
            <div className="driver-found-sheet compact-sheet">
              <div className="sheet-handle" />
              <h2 className="driver-found-title compact-title">
                Водитель рядом:
                <br />
                {etaMin} мин
              </h2>
              <div className="driver-card compact-driver-card">
                <div className="driver-main">
                  <div className="driver-name-row">
                    <span className="driver-name">{driverName}</span>
                    <span className="driver-rating">{driverRating}</span>
                  </div>
                  <div className="driver-car">{driverCar}</div>
                  <div className="driver-plate">{driverPlate}</div>
                  <button type="button" className="ride-details-btn">
                    Детали поездки
                  </button>
                </div>
                <div className="driver-avatar">👤</div>
              </div>
              <div className="driver-actions">
                <button
                  type="button"
                  className="driver-cancel-btn"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  <span className="driver-cancel-icon">
                    <span className="driver-cancel-x">✕</span>
                  </span>
                  <span className="driver-cancel-text">Отмена</span>
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() =>
                    alert(driver?.phone ? `Звонок: ${driver.phone}` : "Звонок водителю")
                  }
                >
                  <img src={phoneIcon} alt="" />
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() => alert("Чат с водителем")}
                >
                  <img src={chatIcon} alt="" />
                </button>
              </div>
            </div>
          )}

          {isDriverArrived && (
            <div className="driver-arrived-sheet compact-sheet">
              <div className="sheet-handle" />
              <div className="ride-status-pill">Машина на месте</div>
              <h2 className="driver-arrived-title compact-title">
                Подойдите к выбранной машине
              </h2>
              <p className="driver-arrived-subtitle">
                Проверьте номер и только потом садитесь
              </p>
              <div className="driver-card driver-card-arrived compact-driver-card">
                <div className="driver-main">
                  <div className="driver-name-row">
                    <span className="driver-name">{driverName}</span>
                    <span className="driver-rating">{driverRating}</span>
                  </div>
                  <div className="driver-car">{driverCar}</div>
                  <div className="driver-plate">{driverPlate}</div>
                </div>
                <div className="driver-avatar">👤</div>
              </div>
              <div className="driver-arrived-tip">
                Машина ждёт вас у точки встречи
              </div>
              <div className="driver-actions">
                <button
                  type="button"
                  className="driver-cancel-btn"
                  onClick={handleMockTripStart}
                >
                  <span className="driver-cancel-icon">
                    <img src={carIcon} alt="" className="find-car-icon-img" />
                  </span>
                  <span className="driver-cancel-text">Я в машине</span>
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() =>
                    alert(driver?.phone ? `Звонок: ${driver.phone}` : "Звонок водителю")
                  }
                >
                  <img src={phoneIcon} alt="" />
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() => alert("Чат с водителем")}
                >
                  <img src={chatIcon} alt="" />
                </button>
              </div>
              <div className="driver-actions driver-actions-secondary">
                <button
                  type="button"
                  className="driver-cancel-btn secondary-cancel-btn"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  <span className="driver-cancel-icon">
                    <span className="driver-cancel-x">✕</span>
                  </span>
                  <span className="driver-cancel-text">Отменить заказ</span>
                </button>
              </div>
            </div>
          )}

          {isTripInProgress && (
            <div className="driver-arrived-sheet compact-sheet">
              <div className="sheet-handle" />
              {renderRideProgress(progressStatus)}
              <div className="ride-status-pill">Поездка началась</div>
              <h2 className="driver-arrived-title compact-title">
                Едем к месту назначения
              </h2>
              <p className="driver-arrived-subtitle">
                Маршрут построен, следим за поездкой
              </p>
              <div className="driver-card driver-card-arrived compact-driver-card">
                <div className="driver-main">
                  <div className="driver-name-row">
                    <span className="driver-name">{driverName}</span>
                    <span className="driver-rating">{driverRating}</span>
                  </div>
                  <div className="driver-car">{driverCar}</div>
                  <div className="driver-plate">{driverPlate}</div>
                </div>
                <div className="driver-avatar">👤</div>
              </div>
              <div className="driver-arrived-tip">
                До прибытия примерно {tripEtaMin} мин
              </div>
              <div className="ride-form-group ride-destination-group">
                <label className="ride-label">Куда едем</label>
                <div className="ride-input-box">
                  <span className="ride-input-icon">
                    <img
                      src={locationIcon}
                      alt=""
                      className="ride-input-icon-img"
                    />
                  </span>
                  <div className="ride-input-text-strong">{rideDropoffAddress}</div>
                </div>
              </div>
              <div className="driver-actions">
                <button
                  type="button"
                  className="driver-cancel-btn"
                  onClick={() =>
                    alert("Поездка уже началась. Позже подключим backend-действие.")
                  }
                >
                  <span className="driver-cancel-icon">
                    <img src={carIcon} alt="" className="find-car-icon-img" />
                  </span>
                  <span className="driver-cancel-text">В пути</span>
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() =>
                    alert(driver?.phone ? `Звонок: ${driver.phone}` : "Звонок водителю")
                  }
                >
                  <img src={phoneIcon} alt="" />
                </button>
                <button
                  type="button"
                  className="driver-icon-btn"
                  onClick={() => alert("Чат с водителем")}
                >
                  <img src={chatIcon} alt="" />
                </button>
              </div>
            </div>
          )}

          {isCancelConfirmOpen && (
            <>
              <div className="sheet-backdrop" />
              <div className="cancel-confirm-sheet">
                <div className="sheet-handle" />
                <h2 className="cancel-confirm-title">Хотите отменить заказ?</h2>
                <p className="cancel-confirm-subtitle">
                  Чрезмерная отмена заказов приводит к временной блокировке профиля
                </p>
                {error ? <div className="error-text">{error}</div> : null}
                <div className="confirm-actions">
                  <button
                    type="button"
                    className="confirm-yes"
                    onClick={handleConfirmCancelRide}
                    disabled={isCancellingRide}
                  >
                    <span className="confirm-icon confirm-icon-yes">✓</span>
                    <span>{isCancellingRide ? "..." : "Да"}</span>
                  </button>
                  <button
                    type="button"
                    className="confirm-no"
                    onClick={() => setIsCancelConfirmOpen(false)}
                    disabled={isCancellingRide}
                  >
                    <span className="confirm-icon confirm-icon-no">✕</span>
                    <span>Нет</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Рендер списка водителей, полученного из MapboxSearchInput */}
          {showDrivers && (
            <DriversList
              drivers={drivers}
              onSelect={(driver) => {
                console.log("Выбран водитель", driver);
              }}
            />
          )}
        </div>
      </div>
    </MobileShell>
  );
}

export default HomePage;