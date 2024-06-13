import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer, { SignalData } from 'simple-peer';
import { FaArrowUp } from 'react-icons/fa';

const socket: Socket = io('https://socketback-6.onrender.com/');
const messageSound = new Audio('/audio/noti.mpeg');

interface IMessage {
  _id: string;
  text: string;
  ip: string;
  createdAt: string;
}

function App(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [userConnected, setUserConnected] = useState<boolean>(false);
  const [callAccepted, setCallAccepted] = useState<boolean>(false);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [incomingCall, setIncomingCall] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callerSignal, setCallerSignal] = useState<SignalData | null>(null);
  const [caller, setCaller] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchMessages();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
    });

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

    socket.on('signal', (data: { from: string, signal: SignalData }) => {
      setIncomingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('signal');
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    }
  };

  const sendMessage = async () => {
    if (message.trim() !== '') {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: message })
        });
        const newMessage = await response.json();
        socket.emit('message', newMessage);
        setMessage('');
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
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

  const callUser = (id: string) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream!
    });

    peer.on('signal', (data: SignalData) => {
      socket.emit('signal', { signal: data, to: id });
    });

    peer.on('stream', (stream: MediaStream) => {
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
    });

    socket.on('signal', (data: { from: string, signal: SignalData }) => {
      peer.signal(data.signal);
    });

    setPeer(peer);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream!
    });

    peer.on('signal', (data: SignalData) => {
      socket.emit('signal', { signal: data, to: caller });
    });

    peer.on('stream', (stream: MediaStream) => {
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal!);

    setPeer(peer);
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
            <p className="text">{formatMessage(msg.text)}</p>
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
      </div>
      <div className="video-container">
        <video ref={myVideoRef} autoPlay playsInline muted />
        {callAccepted && <video ref={userVideoRef} autoPlay playsInline />}
      </div>
      <button onClick={() => callUser('some-user-id')} className='bg-blue-500'>Llamar</button>
      {incomingCall && !callAccepted && (
        <div>
          <h1>Alguien está llamando...</h1>
          <button onClick={acceptCall}>Aceptar</button>
        </div>
      )}
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









