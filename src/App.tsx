import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { FaArrowUp, FaMicrophone, FaStop } from 'react-icons/fa';

const socket: Socket = io('https://socketback-6.onrender.com/');
const messageSound = new Audio('/audio/noti.mpeg');

function App(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [userConnected, setUserConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  interface IMessage {
    _id: string;
    text?: string;
    audioUrl?: string;
    ip: string;
    createdAt: string;
  }

  useEffect(() => {
    socket.on('messages', (data: IMessage[]) => {
      setMessages(data);
    });

    socket.on('message', (data: IMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      playMessageSound();
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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('message', { text: message });
      setMessage('');
    }
  };

  const startRecording = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioBlob(event.data);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (recording && mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const sendAudioMessage = async () => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('https://socketback-6.onrender.com/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.audioUrl) {
        socket.emit('message', { audioUrl: data.audioUrl });
      }

      setAudioBlob(null);
    }
  };

  const playMessageSound = () => {
    messageSound.play();
  };

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
    <div className="mini-chat-container">
      <h1>Chat flipeot</h1>
      
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
            {msg.text && <p className="text">{formatMessage(msg.text)}</p>}
            {msg.audioUrl && (
              <audio controls>
                <source src={msg.audioUrl} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="container-send">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button onClick={sendMessage}><p><FaArrowUp/></p></button>
        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          {recording ? <FaStop /> : <FaMicrophone />}
        </button>
        {audioBlob && <button onClick={sendAudioMessage}>Enviar Audio</button>}
      </div>
    </div>
  );
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const time = `${hours}:${minutes}`;
  return time;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
}

export default App;













