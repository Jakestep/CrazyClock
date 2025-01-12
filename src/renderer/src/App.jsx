import React, { useEffect, useState } from 'react'
import { IoMdCheckmark, IoMdClose } from 'react-icons/io'
import { GiCheckMark } from 'react-icons/gi';
import { IoClose } from 'react-icons/io5';

const App = () => {
  const [time, setTime] = React.useState({hours: 0, minutes: 0, day: 0, month: 0})
  const [crazyTime, setCrazyTime] = React.useState(false)
  const bgRef = React.useRef(null);
  const [bgShadow, setBgShadow] = React.useState('#000000');
  const colorRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [inputUrl, setInputUrl] = useState('')
  const [bgIndex, setBgIndex] = useState(0)
  const [forRefresh, setForRefresh] = useState(false)
  const [choosingFileOrUrl, setChoosingFileOrUrl] = useState('')
  const [spinImage, setSpinImage] = useState(null)
  const [font, setFont] = useState('Teko-Regular')
  const [editingImage, setEditingImage] = useState({
    active: false,
    bgShadow: '#000000'
  })
  const [editingSettings, setEditingSettings] = useState({
    active: false,
    interval: '30',
    spinImage: '',
    choosingImage: false,
  })
  const [backgroundImageList, setBackgroundImageList] = React.useState([])

  const refresh = () => {
    setForRefresh(prev => !prev);
  }

  React.useEffect(() => {
    const func = async () => {
      const db = await new Promise(async (res, rej) => {
        const request = indexedDB.open('listOfImages');
        request.onupgradeneeded = () => {
          console.log("DB Created");
          let db = request.result;
    
          db.createObjectStore("displayData", {autoIncrement: true});
          db.createObjectStore("settings", {autoIncrement: true});
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
            const newItem = {
              imageFile: cursor.value.image,
              color: cursor.value.color || '',
              image: typeof(cursor.value.image) == 'object' ? URL.createObjectURL(cursor.value.image) : cursor.value.image,
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

      let bgIndex = localStorage.getItem("bgIndexPref");
      if (bgIndex > newItems.length - 1) {
        localStorage.setItem("bgIndexPref", 0);
      }
      setBackgroundImageList(() => {
        return newItems
      });
    }
    func();


  }, [bgIndex, forRefresh])

  React.useEffect(() => {

    setBgIndex(parseInt(localStorage.getItem('bgIndexPref')) || 0)
    setFont(localStorage.getItem("font") || 'Teko-Regular')

    const updateFromIDB = async () => {
      const db = await new Promise(async (res, rej) => {
        const request = indexedDB.open('listOfImages');
        request.onupgradeneeded = () => {
          console.log("DB Created");
          let db = request.result;
    
          db.createObjectStore("displayData", {autoIncrement: true});
          db.createObjectStore("settings", {autoIncrement: true});
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

      const request = db.transaction('settings', 'readonly').objectStore('settings').openCursor();

      request.onsuccess = (e) => {
        const cursor = e.target.result

        if (cursor) {
          if (typeof(cursor.value.image) == 'string') {
            setSpinImage(cursor.value.image);
          } else {
            setSpinImage(URL.createObjectURL(cursor.value.image))
          }
          cursor.continue();
        }
      }
      
    }
    if ((!editingSettings.choosingImage && editingSettings.spinImage) || !spinImage) {
      updateFromIDB();
    }

    function doTime() {
        const date = Date();
        const new_date = new Date(date);
        const hours = new_date.getHours();
        const minutes = new_date.getMinutes();;
        const day = new_date.getDate();
        const month = new_date.getDay();
        
        const spinInterval = parseInt(localStorage.getItem('spinInterval') || '30');

        if (minutes % spinInterval == 0) {
          setCrazyTime(true)
        } 
        if (minutes % spinInterval != 0) {
          setCrazyTime(false);
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
    }
    const intervalID = setInterval(doTime, 3000);

    return (() => {
      clearInterval(intervalID);
    })
  }, [editingSettings])  

  const setBgIndexToLatest = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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

    const request = db.transaction("displayData", "readonly");
    const objectStore = request.objectStore('displayData');
    const count = objectStore.count();
    while (count.readyState != 'done') {
      await new Promise((res, rej) => {
        setTimeout(() => {res(true)}, 50);
      })
    }
    setBgIndex(count.result - 1);

    request.onerror = (err) => {
      console.error(`Error adding new image: ${request.error}`);
    }

    setChoosingFileOrUrl('');
    refresh();
  }
  
  const handleClick = () => {
    if (choosingFileOrUrl) {return;}
    setBgIndex((prev) => {
      let newI = parseInt(prev) + 1;
      if (newI >= backgroundImageList.length) {
        newI = 0;
      }
      localStorage.setItem('bgIndexPref', newI);
      return newI;
    })
  }

  const handleFileInput = async (e) => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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
      image: e.target.files[0],
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

    setChoosingFileOrUrl('');
    refresh();

    setBgIndexToLatest();

  }

  const handleChooseFileOrUrl = () => {
    setChoosingFileOrUrl('choose');
    setInputUrl('');
  }

  const handleRemove = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
  
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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
    refresh();
  }

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
  }

  const handleUrlSubmit = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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
      image: inputUrl,
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
    
    setChoosingFileOrUrl('');
    refresh();

    setBgIndexToLatest();

  }

  const handleFileInputSpin = async (e) => {
    
    setEditingSettings(prev => {
      return {
        ...prev,
        spinImage: URL.createObjectURL(e.target.files[0])
      }
    })

    handleSpinSubmit(e.target.files[0]);
  }

  const handleSpinSubmit = async (image) => {
    setEditingSettings(prev => ({
      ...prev,
      choosingImage: false
    }))

    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
  
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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

    const request = db.transaction("settings", "readwrite")
    const objectStore = request.objectStore('settings');
    if (await objectStore.count() != 0) {
      console.log(await objectStore.clear());
    }
    objectStore.add({
      image: image
    })
  }

  const handleSaveChanges = async () => {
    
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
  
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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
    
    const request = db.transaction("displayData", "readwrite")
      .objectStore('displayData')
      .openCursor();
      // let newItems = [];
    request.onsuccess = (e) => {
      const cursor = e.target.result
      if (cursor) {
        if (cursor.key == backgroundImageList[bgIndex].key) {
          cursor.update({
            color: backgroundImageList[bgIndex].color || '',
            image: backgroundImageList[bgIndex].imageFile,
            shadow: editingImage.bgShadow
          });
        }
        cursor.continue();
      } else {
        setEditingImage(prev => {
          return {
            ...prev,
            active: false
          }
        });
        refresh();
      }
    }
  }

  // console.log(backgroundImageList);

  const handleSaveSettings = () => {
    setEditingSettings(false);
  }

  const handleSettingsChange = (e) => {
    setEditingSettings(prev => {
      return {
        ...prev,
        [e.target.name]: e.target.value
      }
    })
  }

  const handleClose = () => {
    window.close();
  }

  const handleSettingsIntervalChange = (e) => {

    if (e.target.value == '61') {
      let keepGoing = window.confirm("By confirming, the reminders to move will be turned off until you turn them back on.\n( Don't forget to turn them back on :D )")
      console.log(keepGoing);
      if (!keepGoing) {
        setEditingSettings(prev => {
          return {...prev}
        })
        return;
      }
    }
    setEditingSettings(prev => {
      return {
        ...prev,
        interval: e.target.value
      }
    })
    localStorage.setItem('spinInterval', e.target.value)
  }

  const handleColorSubmit = async () => {
    const db = await new Promise(async (res, rej) => {
      const request = indexedDB.open('listOfImages');
      request.onupgradeneeded = () => {
        console.log("DB Created");
        let db = request.result;
        db.createObjectStore("displayData", {autoIncrement: true});
        db.createObjectStore("settings", {autoIncrement: true});
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
      image: '',
      color: colorRef.current.value,
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
    
    setChoosingFileOrUrl('');
    refresh();

    setBgIndexToLatest();

  }

  if (backgroundImageList.length == 0) {
    return (
      <div tabIndex={0} className='w-screen h-screen min-w-[10rem] min-h-[10rem] group/drag flex items-center justify-center '>
        <div className='h-40 w-64 bg-[#682D05] relative border-2 border-black rounded flex items-center justify-center'>
          <div className='bg-green-600 w-full h-5 absolute top-0 left-0 flex items-center justify-end pr-1'>
            <div className='w-full h-full dragme' />
            <button onClick={handleClose}><IoMdClose /></button>
          </div>
            {!choosingFileOrUrl &&
              <button onClick={handleChooseFileOrUrl} className='text-xl text-white w-full h-full'>
                Click To Add First Image
              </button>
            }
            <div className='flex flex-col gap-4 fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] h-fit w-fit'>
              {
                choosingFileOrUrl == 'choose' ?
                  <div className='dontdragme border-none h-8 gap-2 w-fit z-[9999] relative flex items-center'>
                    <div onClick={() => colorRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                      <input type='color' ref={colorRef} multiple={false} className='cursor-pointer w-full h-full' />
                      <button onClick={handleColorSubmit}>
                        <IoMdCheckmark />
                      </button>
                    </div>
                    <div onClick={() => fileInputRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                      <input type='file' ref={fileInputRef} onChange={(e) => handleFileInput(e)} multiple={false} className='cursor-pointer max-w-full max-h-full hidden' />
                      <h1 className='absolute -translate-x-[50%] -translate-y-[50%] left-[50%] top-[50%]'>FILE</h1>
                    </div>
                    <div className='relative cursor-pointer bg-blue-400 w-14 h-full flex items-center justify-center border-2 border-white rounded text-white'>
                      <input type='url' className='w-full h-full text-black text-xs pl-1' value={inputUrl} onChange={handleUrlChange} placeholder='URL'/>
                      <button onClick={handleUrlSubmit}>
                        <IoMdCheckmark />
                      </button>
                    </div>
                    <button onClick={() => setChoosingFileOrUrl('')} className='w-fit h-fit text-white border-2 border-white bg-red-500 rounded-[100%] overflow-clip p-1 flex items-center justify-center'><IoClose size={15}/></button>
                  </div>
              : ''
              }
          </div>
        </div>
      </div>
    )
  }

  if (!spinImage) {
    return(
      <div tabIndex={0} className='w-screen h-screen min-w-[10rem] min-h-[10rem] group/drag flex items-center justify-center '>
        <div className='h-40 w-64 bg-[#682D05] relative border-2 border-black rounded flex items-center justify-center'>
          <div className='bg-green-600 w-full h-5 absolute top-0 left-0 flex items-center justify-end pr-1'>
            <div className='w-full h-full dragme' />
            <button onClick={handleClose}><IoMdClose /></button>
          </div>
            {!editingSettings.choosingImage &&
              <button onClick={() => setEditingSettings(prev => ({...prev, choosingImage: true}))} className='text-xl text-white w-full h-full'>
                <h1 className='text-lg'>Click To Add Spin Image</h1>
                <h1 className='text-sm'>(You <span className='italic font-bold'>{' can '}</span>change this later)</h1>
              </button>
            }
            {editingSettings.choosingImage &&
              <div className='dontdragme border-none h-fit gap-2 w-fit z-[9999] relative flex items-center p-1'>
                <div className='flex flex-col gap-2'>
                  <div className='dontdragme border-none h-8 gap-2 w-fit z-[9999] relative flex'>
                    <div onClick={() => fileInputRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                      <input type='file' ref={fileInputRef} multiple={false} onChange={(e) => handleFileInputSpin(e)} className='cursor-pointer max-w-full max-h-full hidden'  />
                      <h1 className='absolute -translate-x-[50%] -translate-y-[50%] left-[50%] top-[50%]'>FILE</h1>
                    </div>
                    <div className='relative cursor-pointer bg-blue-400 w-14 h-full flex items-center justify-center border-2 border-white rounded text-white'>
                      <input type='url' className='w-full h-full text-black text-xs p-1' value={editingSettings.spinImage} name='spinImage' onChange={handleSettingsChange} placeholder='URL'/>
                      <button onClick={() => handleSpinSubmit(editingSettings.spinImage)}>
                        <IoMdCheckmark />
                      </button>
                    </div>
                  </div>
                </div>
            </div>
            }
        </div>
      </div>

    )
  }
  
  return (
    <div tabIndex={0} className={`w-screen h-screen min-w-[10rem] min-h-[10rem] group/drag rounded`}>
      <button onClick={handleClick} className='h-screen w-screen'>
        <div className='h-full w-full'>
          <div className={`${(crazyTime || editingSettings.choosingImage) ? ' bg-cover bg-center animate-spin w-screen h-screen fixed' : ''}`} style={{backgroundImage: `url("${spinImage}")`}} />
            <div className={`fixed w-full h-full flex flex-col items-center justify-center overflow-hidden ${(crazyTime || editingSettings.choosingImage)  ? 'animate-[spin_2s_cubic-bezier(0.5,2,0.5,-2)_infinite] bg-repeat bg-center bg-contain' : 'animate-none'}`} style={{backgroundImage: (crazyTime || editingSettings.choosingImage)  ? `url("${spinImage}")` : ''}}>
              <div ref={bgRef} className={`text-[60vh] dragme m-0 text-black h-fit `} style={{ backgroundImage: `url("${backgroundImageList[bgIndex].image || ''}")`, backgroundColor: `${backgroundImageList[bgIndex].color || ''}`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundRepeat: 'no-repeat', fontSize: '30vw', fontWeight: 'bold', textAlign: 'center', filter: `var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) drop-shadow(0 0 10px ${editingImage.active ? editingImage.bgShadow : backgroundImageList[bgIndex].shadow})`}}>
                <div className='flex items-center h-fit select-none' style={{fontFamily: font || 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; "sans-serif"'}}>
                  <h1 className=''>
                    {time.hours > 12 ? time.hours-12 : time.hours}
                  </h1>
                  <h1
                    className='font-sans'
                    style={{
                      fontFamily: font || 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; "sans-serif"',
                    }}
                  >
                    :
                  </h1>
                  <h1>
                    {time.minutes < 10 ? '0' + time.minutes : time.minutes}
                  </h1>
                </div>
              </div>
            </div>
        </div>
      </button>
      <div className='flex flex-col gap-4 fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] hover:border-[3px] hover:bg-opacity-40 hover:bg-slate-300 border-red-500 rounded mt-[.3rem] dontdragme group/buttons'>
        {
        !editingImage.active && choosingFileOrUrl == '' && !editingSettings.active &&
          <div className='grid grid-cols-3 gap-1 p-1'>
            <div className='row-span-3 grid grid-rows-3'>
              <div />
              <div />
              <button title='Settings' onClick={(e) => setEditingSettings((prev) => ({...prev, active: true}))} key={Math.floor(Math.random() * 10e4)} style={{display: 'block'}} className='  hover:scale-105 group-hover/buttons:opacity-100 border-2 border-white opacity-0 h-4 w-4 z-[9999] bg-black' />
            </div>
            <div className='row-span-3 grid grid-rows-3'>
              <button title='Add New' onClick={() => handleChooseFileOrUrl()} key={Math.floor(Math.random() * 10e4)} style={{display: 'block'}} className='  hover:scale-105 group-hover/buttons:opacity-100 border-2 border-white opacity-0 h-4 w-4 bg-blue-400 z-[9999]' />
              <div />
              <button title='Delete Preset' onClick={(e) => handleRemove(e)}  key={Math.floor(Math.random() * 10e4)} style={{display: 'block'}} className='  hover:scale-105 group-hover/buttons:opacity-100 border-2 border-white opacity-0 h-4 w-4 z-[9999] bg-red-700' />
            </div>
            <div className='row-span-3 grid grid-rows-3'>
              <button title='Close App'  onClick={handleClose}   key={Math.floor(Math.random() * 10e4)} style={{display: 'block'}} className='  hover:scale-105 group-hover/buttons:opacity-100 border-2 border-white opacity-0 h-2 w-2 ml-auto z-[9999] bg-black' />
              <button title='Edit Shadow'  onClick={(e) => setEditingImage(() => ({bgShadow: backgroundImageList[bgIndex].shadow, active: true}))}   key={Math.floor(Math.random() * 10e4)} style={{display: 'block'}} className='  hover:scale-105 group-hover/buttons:opacity-100 border-2 border-white opacity-0 h-4 w-4 z-[9999] bg-pink-300' />
              <div />
            </div>
          </div>
        }
        {
        !editingImage.active && !editingSettings.active &&
          choosingFileOrUrl == 'choose' ?
            <div className='dontdragme border-none h-8 gap-2 w-fit z-[9999] relative flex items-center'>
              <div onClick={() => colorRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                <input type='color' ref={colorRef} multiple={false} className='cursor-pointer w-full h-full' />
                <button onClick={handleColorSubmit}>
                  <IoMdCheckmark />
                </button>
              </div>
              <div onClick={() => fileInputRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                <input type='file' ref={fileInputRef} onChange={(e) => handleFileInput(e)} multiple={false} className='cursor-pointer max-w-full max-h-full hidden' />
                <h1 className='absolute -translate-x-[50%] -translate-y-[50%] left-[50%] top-[50%]'>FILE</h1>
              </div>
              <div className='relative cursor-pointer bg-blue-400 w-14 h-full flex items-center justify-center border-2 border-white rounded text-white'>
                <input type='url' className='w-full h-full text-black text-xs pl-1' value={inputUrl} onChange={handleUrlChange} placeholder='URL'/>
                <button onClick={handleUrlSubmit}>
                  <IoMdCheckmark />
                </button>
              </div>
              <button onClick={() => setChoosingFileOrUrl('')} className='w-fit h-fit text-white border-2 border-white bg-red-500 rounded-[100%] overflow-clip p-1 flex items-center justify-center'><IoClose size={15}/></button>
            </div>
          : ''
        }
        {
          editingImage.active &&
          <div className='dontdragme border-none h-8 gap-2 w-fit z-[9999] relative flex items-center p-1'>
            <input value={editingImage.bgShadow} type='color' title='Text shadow' onChange={(e) => setEditingImage(prev => ({...prev, bgShadow: e.target.value}))} ref={colorRef} className=''/>
            <button onClick={handleSaveChanges} className='text-white border-2 border-white bg-green-400 rounded-[100%] overflow-clip p-1'><GiCheckMark size={15}/></button>
          </div>
        }
        {
          editingSettings.active && !editingSettings.choosingImage &&
          <div className='dontdragme border-none h-fit gap-2 w-fit z-[9999] relative flex items-center p-1'>
            <div className='flex flex-col gap-2'>
                <select className='rounded' title='Spin Interval' name='interval' defaultValue={localStorage.getItem("spinInterval") || '30'} value={editingSettings.interval} onChange={handleSettingsIntervalChange}>
                  <option value='15'>1 / 15 min</option>
                  <option value='30'>1 / 30 min</option>
                  <option value='60'>1 / hour</option>
                  <option value='61' className='text-gray-600 text-xs'>never</option>
                </select>
                <select className='rounded' title='Font' name='font' value={font} onChange={(e) => {
                    setFont(e.target.value);
                    localStorage.setItem("font", e.target.value);
                  }}>
                <option value='sans-serif' className='font-[sans-serif]'>Sans</option>
                <option value='Jersey-15' className='font-[Jersey-15]'>Jersey-15</option>
                <option value='Agu-Display' className='font-[Agu-Display]'>Agu-Display</option>
                <option value='Dancing-Script' className='font-[Dancing-Script]'>Dancing-Script</option>
                <option value='Teko-Regular' className='font-[Teko-Regular]'>Teko-Regular</option>
                <option value='Abril' className='font-[Abril]'>Abril</option>
                </select>
                <button onClick={() => setEditingSettings(prev => ({...prev, choosingImage: true, spinImage: ''}))} className='w-fit p-1 bg-blue-500 border-2 border-white text-sm text-white' title='New Spin Image'>Spinner</button>
            </div>
            <button onClick={handleSaveSettings} className='text-white border-2 border-white bg-green-400 rounded-[100%] overflow-clip p-1 flex'><GiCheckMark size={15}/></button>
          </div>
        }
        {editingSettings.active && editingSettings.choosingImage &&
          <div className='dontdragme border-none h-fit gap-2 w-fit z-[9999] relative flex items-center p-1'>
            <div className='flex flex-col gap-2'>
              <div className='dontdragme border-none h-8 gap-2 w-fit z-[9999] relative flex'>
                <div onClick={() => fileInputRef.current.click()} className=' relative cursor-pointer bg-blue-400 w-14 h-full flex justify-center border-2 border-white rounded text-white'>
                  <input type='file' ref={fileInputRef} multiple={false} onChange={(e) => handleFileInputSpin(e)} className='cursor-pointer max-w-full max-h-full hidden'  />
                  <h1 className='absolute -translate-x-[50%] -translate-y-[50%] left-[50%] top-[50%]'>FILE</h1>
                </div>
                <div className='relative cursor-pointer bg-blue-400 w-14 h-full flex items-center justify-center border-2 border-white rounded text-white'>
                  <input type='url' className='w-full h-full text-black text-xs p-1' value={editingSettings.spinImage} name='spinImage' onChange={handleSettingsChange} placeholder='URL'/>
                  <button onClick={() => handleSpinSubmit(editingSettings.spinImage)}>
                    <IoMdCheckmark />
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setEditingSettings(prev => ({...prev, choosingImage: false}))} className='text-white border-2 border-white bg-red-500 rounded-[100%] overflow-clip p-1 flex'><IoClose size={15}/></button>
          </div>
        }
      </div>
    </div>
  )
}

export default App