import React from 'react'
import backgroundWaterFlow from './assets/backgroundWaterFlow.gif'
import purpleBackground from './assets/purpleBackground.gif'
import crazyGreenBackground from './assets/crazyGreenBackground.gif'
import lameStill from './assets/lameStill.jpg'


const App = () => {
  const [check, setCheck] = React.useState(false)
  const [time, setTime] = React.useState({hours: 0, minutes: 0, day: 0, month: 0})
  const [crazyTime, setCrazyTime] = React.useState(false)
  const [bgIndex, setBgIndex] = React.useState(0)
  const [bgImage, setBgImage] = React.useState(null);
  const bgRef = React.useRef(null);
  const [bgShadow, setBgShadow] = React.useState('#000000');
  const colorRef = React.useRef(null);
  const [currImageObj, setCurrImageObj] = React.useState(null);
  const [backgroundImageList, setBackgroundImageList] = React.useState([
    {
      shadow: '#4488fe',
      image: backgroundWaterFlow,
      key: -1,
    },
    {
      shadow: '#003100',
      image: crazyGreenBackground,
      key: -1,
    },
    {
      shadow: '#551977',
      image: purpleBackground,
      key: -1,
    },
    {
      shadow: '#003300',
      image: lameStill,
      key: -1,
    },
  ])

  React.useEffect(() => {
    const func = async () => {
      const db = await new Promise(async (res, rej) => {
        const request = indexedDB.open('listOfImages');
        request.onupgradeneeded = () => {
          console.log("DB Created");
          let db = request.result;
    
          db.createObjectStore("displayData", {autoIncrement: true});
          res(db);
        }
        request.onsuccess = () => {
          console.log("DB Connection Successful");
          res(request.result);
        }
        request.onerror = () => {
          console.error(request.error);
          rej(request.error);
        }
      })
      
      const request = db.transaction("displayData", "readonly")
        .objectStore('displayData')
        .openCursor();

      let newItems = await new Promise((res, rej) => {
        let newItems = [];
        request.onsuccess = (e) => {
          const cursor = e.target.result
  
          if (cursor) {
            console.log(cursor);
            const newItem = {
              image: URL.createObjectURL(cursor.value.image),
              shadow: cursor.value.shadow,
              key: cursor.key
            }
            newItems.push(newItem);
            cursor.continue();
          } else {
            res(newItems);
          }
        }
      })

      setBackgroundImageList(() => {
          
        return [
          {
            shadow: '#4488fe',
            image: backgroundWaterFlow,
            key: -1
          },
          {
            shadow: '#003100',
            image: crazyGreenBackground,
            key: -1
          },
          {
            shadow: '#551977',
            image: purpleBackground,
            key: -1
          },
          {
            shadow: '#003300',
            image: lameStill,
            key: -1
          },
          ...newItems
        ]
      });
    }
    func();
    

  }, [bgImage, bgIndex])

  React.useEffect(() => {
    const date = Date();
    const new_date = new Date(date);
    const hours = new_date.getHours();
    const minutes = new_date.getMinutes();
    const day = new_date.getDate();
    const month = new_date.getDay();
    if (minutes % 30 == 0) {
      setCrazyTime(true)
    } else {
      if (crazyTime != false) {
        setCrazyTime(false)
      }
    }
    if (time.minutes != minutes) {
      setTime(prevTime => ({...prevTime, minutes: minutes}))
      if (time.hours != hours) {
        setTime(prevTime => ({...prevTime, hours: hours}))
        if (time.day != day) {
          setTime(prevTime => ({...prevTime, day: day}))
          if (time.month != month) {
            setTime(prevTime => ({...prevTime, month: month}))
          }
        }
      }
    }
  }, [check])
  setTimeout(() => setCheck(prevCheck => !prevCheck), 3000)

  

  const handleClick = () => {
    setBgIndex((prev) => {
      let newI = prev + 1;
      if (newI >= backgroundImageList.length) {
        newI = 0;
      }
      return newI;
    })
  }

  const handleChooseShadow = () => {
    colorRef.current.click();
  }

  const handleShadowChange = (e) => {
    setBgShadow(e.target.value);

  }
  
  const handleFileInput = (e) => {
    setBgImage(URL.createObjectURL(e.target.files[0]));
    setCurrImageObj(e.target.files[0])
  }

  const handleSave = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
  
        db.createObjectStore("displayData", {autoIncrement: true});
        res(db);
      }
      request.onsuccess = () => {
        console.log("DB Connection Successful");
        res(request.result);
      }
      request.onerror = () => {
        console.error(request.error);
        rej(request.error);
      }
    })

    let toSave = {
      image: currImageObj,
      shadow: bgShadow
    }

    const request = db.transaction("displayData", "readwrite");
    const objectStore = request.objectStore('displayData');
    objectStore.add(toSave);

    request.onsuccess = () => {
      console.log(`New image added, ID: ${request.result}`);
      
    }
    request.onerror = (err) => {
      console.error(`Error adding new image: ${request.error}`);
    }

    setBgImage(null);
  }

  const handleRemove = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
  
        db.createObjectStore("displayData", {autoIncrement: true});
        res(db);
      }
      request.onsuccess = () => {
        console.log("DB Connection Successful");
        res(request.result);
      }
      request.onerror = () => {
        console.error(request.error);
        rej(request.error);
      }
    })
    const request = db.transaction('displayData', 'readwrite');
    const displayData = request.objectStore('displayData');
    console.log(backgroundImageList);
    displayData.delete(backgroundImageList[bgIndex].key);
    request.oncomplete = () => {
      console.log("Item Deleted");
    }
    setBgIndex(0);
  }

  // console.log(backgroundImageList);

  return (
    <div className='w-screen h-screen min-w-[10rem] min-h-[10rem] group/drag'>
      {!bgImage &&
        <>
          <button onClick={handleClick} className='h-screen w-screen'>
            <div className='h-full w-full'>
              <div className={`${crazyTime ? 'bg-[url("./corgiswimflip.gif")] bg-cover bg-center animate-spin w-screen h-screen fixed' : ''}`} />
                <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden  ${crazyTime ? 'animate-[spin_2s_cubic-bezier(0.5,2,0.5,-2)_infinite] bg-[url("./corgiswimflip.gif")] bg-repeat bg-center bg-contain' : 'animate-none'}`}>
                  <h1 ref={bgRef} className={`text-[60vh] dragme m-0 text-black`} style={{ backgroundImage: `url("${backgroundImageList[bgIndex].image}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundRepeat: 'no-repeat', fontSize: '30vw', fontWeight: 'bold', textAlign: 'center', filter: `var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) drop-shadow(0 0 10px ${backgroundImageList[bgIndex].shadow})`}}>
                    {time.hours > 12 ? time.hours-12 : time.hours}:{time.minutes < 10 ? '0' + time.minutes : time.minutes}
                  </h1>
                </div>
            </div>
          </button>
          <div className='flex flex-col gap-4 fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] h-fit w-fit'>
            <div className='hover:opacity-100 opacity-0 dontdragme border-none h-4 w-4 bg-blue-400 z-[9999]'>
              <input type='file' onChange={(e) => handleFileInput(e)} className='w-full h-full opacity-0' />
            </div>
            <div style={{display: bgIndex >= 4 ? 'block' : 'none'}} className='hover:opacity-100 opacity-0 dontdragme border-none h-4 w-4 z-[9999] bg-red-700'>
              <button onClick={(e) => handleRemove(e)} className='w-full h-full opacity-0' />
            </div>
          </div>
        </>
      }
      {bgImage &&
        <div>
          <button onClick={handleChooseShadow} className='h-screen w-screen'>
            <input type='color' onChange={handleShadowChange} ref={colorRef} className='invisible fixed'/>
            <div className='h-full w-full'>
              <div className={`${crazyTime ? 'bg-[url("./corgiswimflip.gif")] bg-cover bg-center animate-spin w-screen h-screen fixed' : ''}`} />
                <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden  ${crazyTime ? 'animate-[spin_2s_cubic-bezier(0.5,2,0.5,-2)_infinite] bg-[url("./corgiswimflip.gif")] bg-repeat bg-center bg-contain' : 'animate-none'}`}>
                  <h1 ref={bgRef} className={`text-[60vh] dragme m-0 text-black text-mono`} style={{ backgroundImage: `url("${bgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundRepeat: 'no-repeat', fontSize: '30vw', fontWeight: 'bold', textAlign: 'center', filter: `var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) drop-shadow(0 0 10px ${bgShadow})`}}>
                    {time.hours > 12 ? time.hours-12 : time.hours}:{time.minutes < 10 ? '0' + time.minutes : time.minutes}
                  </h1>
                </div>
            </div>
          </button>
          <div className='flex flex-col gap-4 fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] h-fit w-fit'>
            <div className='hover:opacity-100 opacity-0 dontdragme border-none h-4 w-4 bg-blue-400 z-[9999]'>
              <input type='file' onChange={(e) => handleFileInput(e)} className='w-full h-full opacity-0' />
            </div>
            <div className='hover:opacity-100 opacity-0 dontdragme border-none h-4 w-4 bg-green-700 z-[9999]'>
              <button onClick={(e) => handleSave(e)} className='w-full h-full opacity-0' />
            </div>
            <div className='hover:opacity-100 opacity-0 dontdragme border-none h-4 w-4 bg-red-700 z-[9999]'>
              <button onClick={() => setBgImage(null)} className='w-full h-full opacity-0' />
            </div>
          </div>  
        </div>
      }
    </div>
  )
}

export default App