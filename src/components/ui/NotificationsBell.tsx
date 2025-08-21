import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const NotificationsBell: React.FC = () => {
  const { unseenCount, messages, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="اعلان‌ها" className="relative p-2 rounded-full hover:bg-accent/20">
          <Bell className="w-5 h-5 text-primary" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
              {unseenCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>اعلان‌ها</span>
          <button className="text-xs text-muted-foreground hover:text-primary" onClick={markAllRead}>علامت‌گذاری به عنوان خوانده‌شده</button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto py-1">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">اعلانی وجود ندارد</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="px-2 py-2 hover:bg-accent/10 rounded-md">
                <div className="text-sm font-medium">{m.title}</div>
                {m.body ? <div className="text-xs text-muted-foreground mt-0.5">{m.body}</div> : null}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.date).toLocaleString('fa-IR')}</div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


