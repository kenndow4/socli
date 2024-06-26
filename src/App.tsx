import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { FaArrowUp, FaVideo, FaVideoSlash } from 'react-icons/fa';

import './App.css'; // Asegúrate de crear y usar este archivo CSS
import JitsiMeetComponent from './jitsiMeetComponent';

const socket: Socket = io('https://socketback-6.onrender.com/');
const messageSound = new Audio('/audio/noti.mpeg'); // Reemplaza con la ruta correcta de tu archivo de sonido

function App(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [userConnected, setUserConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga
  const [showJitsi, setShowJitsi] = useState<boolean>(false); // Estado para mostrar Jitsi
  const messagesEndRef = useRef<HTMLDivElement>(null); // Referencia al final del contenedor de mensajes

  interface IMessage {
    _id: string;
    text: string;
    ip: string;
    createdAt: string;
  }

  useEffect(() => {
    socket.on('messages', (data: IMessage[]) => {
      setMessages(data);
      setLoading(false); // Deja de cargar cuando se obtienen los mensajes
    });

    socket.on('message', (data: IMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      playMessageSound(); // Reproducir sonido cuando llegue un nuevo mensaje
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

  // Función para hacer scroll hacia abajo al final del contenedor de mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom(); // Llamar a la función de desplazamiento cada vez que cambien los mensajes
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('message', { text: message });
      setMessage('');
    }
  };

  // Función para reproducir el sonido del mensaje
  const playMessageSound = () => {
    messageSound.play();
  };

  // Función para dar formato a los mensajes y convertir los enlaces en enlaces clicables
  const formatMessage = (text: string): JSX.Element[] => {
    const regex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.match(regex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className={`mini-chat-container ${showJitsi ? 'full-screen' : ''}`}>
      <div className='head'>
        <h1>Chat flipeot</h1>
        <button className='camera' onClick={() => setShowJitsi(!showJitsi)}>
          {showJitsi ? <FaVideoSlash width={30}  /> : <FaVideo width={30} />}
        </button>
      </div>
      
      {loading ? ( // Mostrar mensaje de carga si está cargando
        <div className="loading">Loading KZX...</div>
      ) : (
        !showJitsi && (
          <>
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
                  <p className="text">{formatMessage(msg.text)}</p>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Referencia al final del contenedor de mensajes */}
            </div>
            <div className="container-send">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje"
              />
              <button onClick={sendMessage}><p><FaArrowUp/></p></button>
            </div>
          </>
        )
      )}

      {/* Renderizar el componente de Jitsi si showJitsi es true */}
      {showJitsi && <JitsiMeetComponent roomName="testRoom" userName="testUser" />}
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







