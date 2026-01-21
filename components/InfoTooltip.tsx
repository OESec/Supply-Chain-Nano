
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
      setIsVisible(true);
    }
  };

  return (
    <>
      <div 
        ref={iconRef}
        className="inline-flex items-center ml-2 cursor-help text-gray-400 hover:text-gray-500 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info className="w-4 h-4" />
      </div>
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none flex flex-col items-center"
          style={{ 
            top: coords.top, 
            left: coords.left,
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <div className="bg-slate-800 text-white text-xs rounded p-2 w-48 shadow-xl text-center font-normal normal-case tracking-normal leading-normal border border-slate-700">
            {text}
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800 -mt-[1px]"></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InfoTooltip;
