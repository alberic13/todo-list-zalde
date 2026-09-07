import React from "react";
import { ExternalLink } from "lucide-react";

export interface CalendarQuickConnectProps {
  googleSubscribeUrl: string;
  webcalFeedUrl: string;
}

export const CalendarQuickConnect: React.FC<CalendarQuickConnectProps> = ({
  googleSubscribeUrl,
  webcalFeedUrl,
}) => {
  return (
    <div className="space-y-2 pt-1">
      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Sambungkan Langsung:
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Google Calendar */}
        <a
          href={googleSubscribeUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
              G
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Google Calendar
              </h4>
              <p className="text-[10px] text-slate-500">Buka langsung di Google Calendar</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* Apple Calendar */}
        <a
          href={webcalFeedUrl}
          className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-xs">
              
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Apple Calendar
              </h4>
              <p className="text-[10px] text-slate-500">Untuk iPhone, iPad, atau Mac</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};
