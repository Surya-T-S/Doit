import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { toDateStr, getTodayStr, getTomorrowStr } from '../../utils/dates';

interface WheelColumnProps {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (val: string) => void;
  width?: string | number;
}

const ITEM_HEIGHT = 36;

function WheelColumn({ options, value, onChange, width }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const [activeValue, setActiveValue] = useState(value);

  // Sync activeValue when external value changes
  useEffect(() => {
    setActiveValue(value);
  }, [value]);

  // Center on value immediately on mount and external updates
  useEffect(() => {
    const scrollToValue = () => {
      const idx = options.findIndex((o) => o.value === value);
      if (idx !== -1 && containerRef.current && !isUserScrollingRef.current) {
        containerRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    };

    scrollToValue();
    const raf = requestAnimationFrame(scrollToValue);
    const timer = setTimeout(scrollToValue, 40);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [value, options]);

  // High performance smooth scroll handler:
  // Updates local active value visually while user is scrolling,
  // but only commits onChange to parent when scroll has paused/settled.
  const handleScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    if (!containerRef.current) return;

    const top = containerRef.current.scrollTop;
    const idx = Math.round(top / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(idx, options.length - 1));

    if (options[clampedIdx] && options[clampedIdx].value !== activeValue) {
      setActiveValue(options[clampedIdx].value);
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      if (options[clampedIdx] && options[clampedIdx].value !== value) {
        onChange(options[clampedIdx].value);
      }
    }, 80);
  }, [options, activeValue, value, onChange]);

  // Clicking an item smoothly centers it
  const handleClickItem = (idx: number, optValue: string) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
    setActiveValue(optValue);
    onChange(optValue);
  };

  return (
    <div
      ref={containerRef}
      className="ios-wheel-column"
      style={{ width }}
      onScroll={handleScroll}
    >
      <div className="ios-wheel-spacer" />
      {options.map((opt, idx) => {
        const isSelected = opt.value === activeValue;
        return (
          <div
            key={opt.value}
            className={`ios-wheel-item${isSelected ? ' active' : ''}`}
            onClick={() => handleClickItem(idx, opt.value)}
          >
            {opt.label}
          </div>
        );
      })}
      <div className="ios-wheel-spacer" />
    </div>
  );
}

export interface IOSDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  selectedTime: string | null; // HH:mm or null
  onTimeChange: (time: string | null) => void;
  use24h?: boolean;
  showQuickPresets?: boolean; // When false (date selected from calendar), hide Today/Tomorrow
}

export function IOSDatePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  use24h = false,
  showQuickPresets = true,
}: IOSDatePickerProps) {
  const hasTime = Boolean(selectedTime);

  // Generate a comprehensive set of days centered around the selected date
  const dateOptions = useMemo(() => {
    const opts: Array<{ label: string; value: string }> = [];
    const today = new Date();
    let targetDate = today;
    try {
      if (selectedDate) targetDate = parseISO(selectedDate);
    } catch {
      targetDate = today;
    }

    const minDate = today < targetDate ? today : targetDate;
    const startDate = addDays(minDate, -20);
    const maxDate = today > targetDate ? today : targetDate;
    const endDate = addDays(maxDate, 60);

    let curr = startDate;
    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();

    while (curr <= endDate) {
      const val = toDateStr(curr);
      let label = format(curr, 'EEE, MMM d');
      if (val === todayStr) {
        label = `Today · ${format(curr, 'MMM d')}`;
      } else if (val === tomorrowStr) {
        label = `Tomorrow · ${format(curr, 'MMM d')}`;
      }
      opts.push({ label, value: val });
      curr = addDays(curr, 1);
    }

    // Fallback if selectedDate was not included
    if (!opts.some((o) => o.value === selectedDate) && selectedDate) {
      opts.unshift({
        label: format(parseISO(selectedDate), 'EEE, MMM d'),
        value: selectedDate,
      });
    }

    return opts;
  }, [selectedDate]);

  // Parse current time into parts
  const parsedTimeParts = useMemo(() => {
    const rawTime = selectedTime || '09:00';
    const [hStr, mStr] = rawTime.split(':');
    let hourNum = parseInt(hStr, 10);
    if (isNaN(hourNum)) hourNum = 9;

    let minuteNum = parseInt(mStr, 10);
    if (isNaN(minuteNum)) minuteNum = 0;
    const roundedMin = (Math.round(minuteNum / 5) * 5) % 60;
    const minuteFormatted = roundedMin.toString().padStart(2, '0');

    if (use24h) {
      return {
        hour: hourNum.toString().padStart(2, '0'),
        minute: minuteFormatted,
        meridiem: 'AM',
      };
    }

    const meridiem = hourNum >= 12 ? 'PM' : 'AM';
    let h12 = hourNum % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour: h12.toString(),
      minute: minuteFormatted,
      meridiem,
    };
  }, [selectedTime, use24h]);

  // Hour Options
  const hourOptions = useMemo(() => {
    if (use24h) {
      return Array.from({ length: 24 }, (_, i) => {
        const val = i.toString().padStart(2, '0');
        return { label: val, value: val };
      });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const val = (i + 1).toString();
      return { label: val, value: val };
    });
  }, [use24h]);

  // Minute Options (5-minute intervals like iPhone)
  const minuteOptions = useMemo(() => {
    return ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => ({
      label: m,
      value: m,
    }));
  }, []);

  // Meridiem Options
  const meridiemOptions = useMemo(
    () => [
      { label: 'AM', value: 'AM' },
      { label: 'PM', value: 'PM' },
    ],
    []
  );

  // Helper to reassemble time
  const updateTime = useCallback(
    (newHour: string, newMinute: string, newMeridiem: string) => {
      if (use24h) {
        onTimeChange(`${newHour.padStart(2, '0')}:${newMinute}`);
        return;
      }
      let h = parseInt(newHour, 10);
      if (newMeridiem === 'PM' && h < 12) h += 12;
      if (newMeridiem === 'AM' && h === 12) h = 0;
      onTimeChange(`${h.toString().padStart(2, '0')}:${newMinute}`);
    },
    [use24h, onTimeChange]
  );

  const toggleTime = () => {
    if (hasTime) {
      onTimeChange(null);
    } else {
      onTimeChange('09:00');
    }
  };

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  // Formatted date string for picked date display
  const formattedPickedDate = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return format(d, 'EEEE, MMM d');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="ios-picker-card">
      {/* iOS Top Bar: Quick Date Chips (when general) or Picked Date Display (when from calendar) + Time Toggle */}
      <div className="ios-picker-topbar">
        {showQuickPresets ? (
          <div className="ios-quick-dates">
            <button
              type="button"
              className={`ios-segmented-btn${selectedDate === todayStr ? ' active' : ''}`}
              onClick={() => onDateChange(todayStr)}
            >
              Today
            </button>
            <button
              type="button"
              className={`ios-segmented-btn${selectedDate === tomorrowStr ? ' active' : ''}`}
              onClick={() => onDateChange(tomorrowStr)}
            >
              Tomorrow
            </button>
          </div>
        ) : (
          <div className="ios-picked-date-badge">
            <span className="ios-picked-date-text">{formattedPickedDate}</span>
          </div>
        )}

        {/* Time Switch (iPhone toggle style) */}
        <div className="ios-time-toggle-group">
          <span className="ios-toggle-label">{hasTime ? 'Time' : 'All-day'}</span>
          <button
            type="button"
            className={`ios-switch${hasTime ? ' on' : ''}`}
            onClick={toggleTime}
            aria-label="Toggle due time"
          >
            <div className="ios-switch-thumb" />
          </button>
        </div>
      </div>

      {/* iOS Wheels Drum Roll Area */}
      <div className="ios-wheels-wrapper">
        <div className="ios-wheel-center-bar" />
        <div className="ios-wheels-mask" />

        {/* Date Wheel Column - Always smoothly centered on picked date */}
        <WheelColumn
          options={dateOptions}
          value={selectedDate}
          onChange={onDateChange}
          width="50%"
        />

        {/* Time Wheels Columns (if Time is toggled on) */}
        {hasTime ? (
          <>
            {/* Hour Wheel */}
            <WheelColumn
              options={hourOptions}
              value={parsedTimeParts.hour}
              onChange={(newH) =>
                updateTime(newH, parsedTimeParts.minute, parsedTimeParts.meridiem)
              }
              width="18%"
            />

            <span className="ios-wheel-colon">:</span>

            {/* Minute Wheel */}
            <WheelColumn
              options={minuteOptions}
              value={parsedTimeParts.minute}
              onChange={(newM) =>
                updateTime(parsedTimeParts.hour, newM, parsedTimeParts.meridiem)
              }
              width="18%"
            />

            {/* AM / PM Column (12h mode only) */}
            {!use24h && (
              <WheelColumn
                options={meridiemOptions}
                value={parsedTimeParts.meridiem}
                onChange={(newMer) =>
                  updateTime(parsedTimeParts.hour, parsedTimeParts.minute, newMer)
                }
                width="14%"
              />
            )}
          </>
        ) : (
          <div className="ios-allday-label">
            All-Day (No Time)
          </div>
        )}
      </div>
    </div>
  );
}
