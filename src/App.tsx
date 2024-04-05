import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:4000');

function App(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [userConnected, setUserConnected] = useState<boolean>(false);

  interface IMessage {
    _id: string;
    text: string;
    ip: string;
    createdAt: string;
  }

  useEffect(() => {
    socket.on('messages', (data: IMessage[]) => {
      setMessages(data);
    });

    socket.on('message', (data: IMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('connect', () => {
      setUserConnected(true);
    });

    socket.on('disconnect', () => {
      setUserConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('message', { text: message });
      setMessage('');
    }
  };

  return (
    <div className="mini-chat-container">
      <h1>Chat flipeo</h1>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <div className="cont-a-h">
              <p className='ip-avatar'>{msg.ip}</p> 
              <div className="message-time">
                <p>
                  {formatMessageTime(msg.createdAt)} {formatDate(msg.createdAt)}
                  <span style={{ color: userConnected ? '#4CAF50' : '#FF5733', marginLeft:"10px" }}>●</span>
                </p>
              </div>
            </div>
            <p className="text">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="container-send">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}

// Función para dar formato a la hora del mensaje
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const time = `${hours}:${minutes}`;
  return time;
}

// Función para dar formato a la fecha
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
}

export default App;









