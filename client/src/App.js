import "./App.css";

import socketIOClient from "socket.io-client";
import { useImmer } from "use-immer";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { Names } from "./Names";
const reloadUrl = "escape/";
const socket = socketIOClient("https://chat.hh8888.co");
function getQueryStringValue(key) {
  return decodeURIComponent(
    window.location.search.replace(
      new RegExp(
        "^(?:.*[&\\?]" +
          // eslint-disable-next-line
          encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") +
          "(?:\\=([^&]*))?)?.*$",
        "i"
      ),
      "$1"
    )
  );
}

const getName = (id) => {
  let ret = 0;
  for (const index in id) {
    ret = id.charCodeAt(index);
  }
  return Names[ret % Names.length];
};
// get room id from location search
let room = getQueryStringValue("room") || "1";
let admin = getQueryStringValue("admin") || "";
socket.emit("joinRoom", { username: `${getName(socket.id)}`, room, admin });
const getAvatar = (id) => {
  let ret = 0;
  for (const index in id) {
    ret = id.charCodeAt(index);
  }
  return (((ret % 100) + 1) * 0.001).toFixed(3).split(".")[1];
};
const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  return {
    value,
    setValue,
    reset: () => setValue(""),
    bind: {
      value,
      onChange: (event) => {
        setValue(event.target.value);
      },
    },
  };
};

function App() {
  const [messages, setMessages] = useImmer([]);
  const [userList, setUserList] = useState([]);
  const [visible, setVisible] = useState(true);
  const [owner, setOwner] = useState(false);
  const { value: message, bind: bindMessage, reset: resetMessage } = useInput(
    ""
  );
  const [imageData, setImageData] = useState(null);
  const messageBox = useRef();
  const sendMessage = (evt) => {
    evt.preventDefault();
    if (message.trim().length) {
      socket.emit("chatMessage", message);
      resetMessage();
    }
    if (imageData) {
      socket.emit("chatMessage", imageData);
      setImageData(null);
    }
  };
  useEffect(() => {
    socket.on("roomUsers", ({ room, users }) => {
      setUserList(users);
      let owner = users.filter((user) => user.owner);
      if (owner.length === 1 && owner[0].id === socket.id) {
        setOwner(true);
      } else {
        setOwner(false);
      }
    });
    socket.on("message", (data) => {
      setMessages((draft) => {
        draft.push(data);
      });
    });
    socket.on("kick", () => {
      let ret = window.confirm("您被踢下线了");
      if (ret) {
        window.location.replace(reloadUrl);
      } else {
        window.location.replace(reloadUrl);
      }
    });
    socket.on("disconnect", () => {
      window.confirm("连接断开了,请刷新");
    });
    return () => socket.disconnect();
  }, [setMessages]);
  useEffect(() => {
    messageBox.current.scrollTop = messageBox.current.scrollHeight;
  }, [messages]);
  return (
    <>
      <div className="main">
        <h3 className="title" style={{ textAlign: "center", margin: "10px 0" }}>
          房间[{room}]
        </h3>
        <div style={{ backgroundColor: "#dddddd", padding: "10px" }}>
          <h5
            style={{
              textAlign: "center",
              margin: "0px 0 10px 0",
              color: "#333",
              fontSize: "13px",
            }}
            onClick={() => {
              setVisible(!visible);
            }}
          >
            房间成员
          </h5>
          <ul
            className="users-ul"
            style={{
              display: !visible ? "none" : "grid",
              maxHeight: "65px",
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            {userList.map((user) => {
              return (
                <li key={user.id}>
                  {owner && socket.id !== user.id && (
                    <div className="action">
                      <button
                        onClick={() => {
                          socket.emit("forbid", { room, user });
                        }}
                      >
                        {user.canspeak ? "禁言" : "解禁"}
                      </button>
                      <button
                        onClick={() => {
                          socket.emit("kick", { room, user });
                        }}
                      >
                        踢人
                      </button>
                    </div>
                  )}
                  <img
                    alt="avatar"
                    width="20px"
                    height="20px"
                    style={{ borderRadius: "10px" }}
                    src={`avatars/${getAvatar(user.id)}.jpg`}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      padding: "0 0 0 6px",
                    }}
                  >
                    {`${getName(user.id)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="name">
          <span>
            <i className="far fa-user"></i>
          </span>
          <input
            type="text"
            id="name-input"
            readOnly
            className="name-input"
            placeholder="此处修改显示名"
            defaultValue={socket.id && `${getName(socket.id)}`}
            maxLength="20"
          />
        </div>

        <ul
          className="message-container"
          ref={messageBox}
          id="message-container"
        >
          {messages.map((m, i) => {
            return (
              <li
                key={i}
                className={
                  m.sender === socket.id ? "message-right" : "message-left"
                }
              >
                <p className="message">
                  {m.message.length > 500 ? (
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        minHeight: "240px",
                      }}
                    >
                      <img
                        alt="avatar"
                        src={`data:image/png;base64,${m.message}`}
                        width="100%"
                        height="100%"
                        style={{
                          objectFit: "contain",
                          backgroundColor: "#f2f2f2",
                          borderRadius: "5px",
                        }}
                      />
                    </span>
                  ) : (
                    m.message
                  )}
                  <span>
                    <img
                      alt="avatar"
                      style={{ borderRadius: "100px" }}
                      src={`avatars/${getAvatar(m.sender)}.jpg`}
                      width="8%"
                      height="8%"
                    />{" "}
                    at {m.time}
                  </span>
                </p>
              </li>
            );
          })}
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
          <div className="image-button" style={{ position: "relative" }}>
            {!imageData ? (
              <FontAwesomeIcon
                icon={faImage}
                style={{ position: "absolute", top: "16px", left: "16px" }}
              />
            ) : (
              <img
                alt="avatar"
                src={`data:image/png;base64,${imageData}`}
                height="90%"
                width="90%"
                style={{
                  position: "absolute",
                  top: "5%",
                  left: "5%",
                  objectFit: "contain",
                }}
              />
            )}
            <input
              type="file"
              onChange={(evt) => {
                let file = evt.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (readEvt) => {
                    let bs = readEvt.target.result;
                    setImageData(btoa(bs));
                  };
                  reader.readAsBinaryString(file);
                }
              }}
              style={{
                opacity: 0,
                width: "48px",
                height: "48px",
                zIndex: "100",
              }}
            />
          </div>
          <button type="submit" className="send-button">
            发送{" "}
            <span>
              <i className="fas fa-paper-plane"></i>
            </span>
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
