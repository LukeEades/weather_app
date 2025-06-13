import { useEffect, useState } from "react"
import "./stylesheets/weather.scss"
import classNames from "classnames"

const weatherApiKey = "WTPCMQBGXDCHJ3KQZ9QQN2VTL"
const getQueryString = location => {
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/next24hours?unitGroup=us&key=${weatherApiKey}`
}
const App = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [location, setLocation] = useState(null)
  const [notification, setNotification] = useState({
    message: "none",
    hidden: true,
  })
  const showNotification = message => {
    setNotification({
      message,
      hidden: false,
    })
    setTimeout(() => {
      setNotification({
        message,
        hidden: true,
      })
    }, 3000)
  }
  useEffect(() => {
    const location = localStorage.getItem("location")
    if (location !== null) {
      findLocation(location)
      return
    }
    navigator.geolocation.getCurrentPosition(
      e => {
        findLocation(e.coords.latitude, e.coords.longitude)
      },
      () => {
        findLocation("london")
      }
    )
  }, [])
  const hours = location
    ? location.days[0].hours.concat(location.days[1].hours)
    : []
  const findLocation = (...args) => {
    let query
    if (args.length === 1) {
      query = getQueryString(args[0])
    } else if (args.length === 2) {
      query = getQueryString(`${args[0]}%2C${args[1]}`)
    } else {
      return
    }
    fetch(query)
      .then(result => {
        return result.json()
      })
      .then(body => {
        if (args.length === 2) {
          body.resolvedAddress = "Current Location"
        } else {
          localStorage.setItem("location", args[0])
        }
        setLocation(body)
      })
      .catch(error => {
        console.log("error in fetching location", error)
        showNotification(`Unable to find ${searchTerm}`)
      })
  }
  return (
    <>
      <Notification notification={notification} />
      <header>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (searchTerm === "") return
            findLocation(searchTerm)
            setSearchTerm("")
          }}
          className="search-form"
        >
          <input
            name="city"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button type="submit" name="button">
            Find
          </button>
        </form>
      </header>
      <main>
        <div className="weather-data">
          <h2 className="weather-data__title">
            {location?.resolvedAddress || "Loading"}
          </h2>
          <div className="weather-data__details">
            <HourList hours={hours} />
            <CurrentConditions location={location} />
          </div>
        </div>
      </main>
      <footer></footer>
    </>
  )
}
const Notification = ({ notification }) => {
  const classes = classNames({
    notification: true,
    "notification--hidden": notification.hidden,
  })
  return <div className={classes}>{notification.message}</div>
}
const HourList = ({ hours }) => {
  const currentHour = new Date().getHours()
  const hourIndex = hours.findIndex(hour => {
    const number = Number(hour.datetime.slice(0, 2))
    return number === currentHour
  })
  let filtered = hours
  if (hourIndex !== -1) {
    filtered = filtered.slice(hourIndex)
  }
  return (
    <div className="list-container">
      <ul className="hour-list">
        {filtered.map((hour, index) => {
          return <Hour key={index} hourData={hour} />
        })}
      </ul>
    </div>
  )
}
const Hour = ({ hourData }) => {
  const displayTime = datetime => {
    const time = Number(datetime.slice(0, 2))
    if (time === 0) {
      return `12am`
    }
    return `${time > 12 ? time - 12 : time}${time < 12 ? "am" : "pm"}`
  }
  return (
    <li className="hour-data hour-list__item">
      <span>{displayTime(hourData.datetime)}</span>
      <span>{hourData.temp}°F</span>
    </li>
  )
}
const CurrentConditions = ({ location }) => {
  return (
    <div className="current">
      <h2 className="current__title">Current</h2>
      <div className="current__conditions">
        <div className="condition">
          <h3>Temp</h3>
          <span className="condition__data">
            {location?.currentConditions.temp || "Loading"}
          </span>
        </div>
        <div className="condition">
          <h3>Wind</h3>
          <span className="condition__data">
            {location?.currentConditions.windspeed || "Loading"}
          </span>
          <span>mph</span>
        </div>
        <div className="condition">
          <h3>Rain</h3>
          <span className="condition__data">
            {location ? location.currentConditions.precipprob + "%" : "Loading"}
          </span>
        </div>
        <div className="condition">
          <h3>Conditions</h3>
          <span className="condition__data">
            {location?.currentConditions.conditions || "Loading"}
          </span>
        </div>
      </div>
    </div>
  )
}
export default App
