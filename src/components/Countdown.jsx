import React, { useState, useEffect } from 'react';
import { Plane, MapPin } from 'lucide-react';

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-08-16T00:00:00');

    const calculateTime = () => {
      const now = new Date();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-6 shadow-lg border border-blue-800/50 text-white relative overflow-hidden mb-6">
      <div className="absolute right-0 top-0 opacity-10">
        <MapPin size={120} />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="text-teal-400" /> Rumo a Ushuaia
          </h2>
          <p className="text-blue-200">16 de Agosto - O Fim do Mundo</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-slate-800/50 p-3 rounded-lg min-w-[80px] backdrop-blur-sm">
            <span className="block text-3xl font-bold text-teal-400">{timeLeft.days}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Dias</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Countdown;
