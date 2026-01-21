import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  return (
    <div className="group relative flex items-center ml-2 cursor-help">
      <Info className="w-4 h-4 text-gray-400" />
      <div className="hidden group-hover:block bg-slate-800 text-white text-xs rounded p-2 w-48 z-50 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center font-normal normal-case tracking-normal leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

export default InfoTooltip;