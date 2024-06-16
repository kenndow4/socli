import React, { useEffect, useRef } from 'react';

interface JitsiMeetComponentProps {
  roomName: string;
  userName: string;
}

const JitsiMeetComponent: React.FC<JitsiMeetComponentProps> = ({ roomName, userName }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadJitsiScript = () => {
      const existingScript = document.getElementById('jitsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.id = 'jitsi-script';
        document.body.appendChild(script);
        script.onload = () => {
          initializeJitsi();
        };
      } else {
        initializeJitsi();
      }
    };

    const initializeJitsi = () => {
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: userName
        }
      };
      const api = new (window as any).JitsiMeetExternalAPI(domain, options);

      return () => api.dispose();
    };

    loadJitsiScript();
  }, [roomName, userName]);

  return (
    <div>
      <div ref={jitsiContainerRef} style={{ height: '600px', width: '800px' }} />
    </div>
  );
};

export default JitsiMeetComponent;
