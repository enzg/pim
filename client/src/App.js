import "./App.css";


import socketIOClient from "socket.io-client";
import { useImmer } from 'use-immer';
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'

const socket = socketIOClient('http://localhost:3001');
function getQueryStringValue(key) {
  // eslint-disable-next-line
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

// get room id from location search 
let room = getQueryStringValue('room') || '1'
let username = `游客`
socket.emit('joinRoom', { username, room })
const getAvatar = id => {
  let ret = 0
  for (const index in id) {
    ret = id.charCodeAt(index)
  }
  return ((ret % 101) * 0.001).toFixed(3).split('.')[1]
}
const useInput = initialValue => {
  const [value, setValue] = useState(initialValue);
  return {
    value,
    setValue,
    reset: () => setValue(""),
    bind: {
      value,
      onChange: event => {
        setValue(event.target.value);
      }
    }
  };
};

function App() {
  const [messages, setMessages] = useImmer([]);
  const { value: message, bind: bindMessage, reset: resetMessage } = useInput('');
  const [imageData, setImageData] = useState(null)
  const messageBox = useRef()
  const sendMessage = (evt) => {
    evt.preventDefault();
    if (message.trim().length) {
      socket.emit('chatMessage', message)
      resetMessage();
    }
    if (imageData) {
      socket.emit('chatMessage', imageData)
      setImageData(null)
    }
  }
  useEffect(() => {
    socket.on('roomUsers', ({ room, users }) => {
      console.log({ room, users })
    })
    socket.on('message', data => {
      setMessages(draft => {
        draft.push(data)
      })
    })
    socket.on('disconnect', () => {
      console.log('disconnect')
    })
    return () => socket.disconnect()
  }, [setMessages])
  useEffect(() => {
    messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [messages])
  return <>
    <h1 className="title">💬 #{room}</h1>
    <div className="main">
      <div className="name">
        <span><i className="far fa-user"></i></span>
        <input
          type="text"
          id="name-input"
          readOnly
          className="name-input"
          placeholder='此处修改显示名'
          defaultValue={username}
          maxLength="20"
        />
      </div>

      <ul className="message-container" ref={messageBox} id="message-container">
        {
          messages.map((m, i) => {
            return <li key={i} className={m.sender === socket.id ? 'message-right' : 'message-left'}>
              <p className='message'>
                {m.message.length > 500 ?
                  <span style={{ display: 'grid', placeItems: 'center', minHeight: '240px' }}>
                    <img src={`data:image/png;base64,${m.message}`} width='100%' height='100%' style={{ objectFit: 'contain', backgroundColor: '#f2f2f2', borderRadius: '5px' }} />
                  </span> : m.message}
                <span><img style={{ borderRadius: '100px' }} src={`avatars/${getAvatar(m.sender)}.jpg`} width='8%' height='8%' /> at {m.time}</span>
              </p>
            </li>
          })
        }
      </ul>

      <form className="message-form" id="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          name="message"
          placeholder="说点啥..."
          id="message-input"
          className="message-input"
          {...bindMessage}
        />
        <div className="v-divider"></div>
        <div className="image-button" style={{ position: 'relative' }}>
          {
            !imageData ?
              <FontAwesomeIcon icon={faImage} style={{ position: 'absolute', top: '16px', left: '16px' }} />
              : <img src={`data:image/png;base64,${imageData}`}
                height='90%'
                width='90%'
                style={{ position: 'absolute', top: '5%', left: '5%', objectFit: 'contain' }} />
          }
          <input type="file" onChange={(evt) => {
            let file = evt.target.files[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (readEvt) => {
                let bs = readEvt.target.result
                setImageData(btoa(bs))
              }
              reader.readAsBinaryString(file)
            }
          }} style={{ opacity: 0, width: '48px', height: '48px', zIndex: '100' }} />
        </div>
        <button type="submit" className="send-button">
          发送 <span><i className="fas fa-paper-plane"></i></span>
        </button>
      </form>
    </div>
  </>
}

export default App;
