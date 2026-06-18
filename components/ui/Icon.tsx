import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

export type IconName =
  | 'home' | 'focus' | 'progress' | 'heart' | 'share' | 'bookmark'
  | 'flame' | 'wind' | 'play' | 'pause' | 'check' | 'chevR' | 'chevL'
  | 'chevD' | 'close' | 'plus' | 'sun' | 'moon' | 'rain' | 'ocean'
  | 'forest' | 'bell' | 'star' | 'clock' | 'sparkle' | 'arrowR' | 'arrowL'
  | 'settings' | 'target' | 'mute'
  | 'lock' | 'unlock' | 'mail' | 'calendar' | 'feather'
  | 'download' | 'info' | 'edit' | 'trash';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}

function Icon({
  name,
  size = 24,
  color = 'currentColor',
  fill = 'none',
  strokeWidth = 1.7,
}: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
  };

  const s = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const sf = { ...s, fill };

  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" {...sf} />
          <Path d="M9 21V12h6v9" {...s} />
        </Svg>
      );
    case 'focus':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="9" {...s} />
          <Circle cx="12" cy="12" r="4" {...sf} />
          <Line x1="12" y1="2" x2="12" y2="5" {...s} />
          <Line x1="12" y1="19" x2="12" y2="22" {...s} />
          <Line x1="2" y1="12" x2="5" y2="12" {...s} />
          <Line x1="19" y1="12" x2="22" y2="12" {...s} />
        </Svg>
      );
    case 'progress':
      return (
        <Svg {...props}>
          <Path d="M18 20V10" {...s} />
          <Path d="M12 20V4" {...s} />
          <Path d="M6 20v-6" {...s} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...props}>
          <Path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            {...sf}
          />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...props}>
          <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" {...s} />
          <Polyline points="16 6 12 2 8 6" {...s} />
          <Line x1="12" y1="2" x2="12" y2="15" {...s} />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg {...props}>
          <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" {...sf} />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...props}>
          <Path
            d="M12 2c0 0-4 4-4 8.5C8 13.9 9.8 16 12 16s4-2.1 4-5.5C16 6 12 2 12 2z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={fill}
          />
          <Path
            d="M12 16c0 0-2.5 1-2.5 3 0 1.4 1.1 2.5 2.5 2.5S14.5 20.4 14.5 19c0-2-2.5-3-2.5-3z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={fill}
          />
        </Svg>
      );
    case 'wind':
      return (
        <Svg {...props}>
          <Path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2" {...s} />
          <Path d="M9.6 4.6A2 2 0 1111 8H2" {...s} />
          <Path d="M12.6 19.4A2 2 0 1114 16H2" {...s} />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...props}>
          <Polygon points="5 3 19 12 5 21 5 3" {...sf} />
        </Svg>
      );
    case 'pause':
      return (
        <Svg {...props}>
          <Rect x="6" y="4" width="4" height="16" rx="1" {...sf} />
          <Rect x="14" y="4" width="4" height="16" rx="1" {...sf} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20 6 9 17 4 12" {...s} />
        </Svg>
      );
    case 'chevR':
      return (
        <Svg {...props}>
          <Polyline points="9 18 15 12 9 6" {...s} />
        </Svg>
      );
    case 'chevL':
      return (
        <Svg {...props}>
          <Polyline points="15 18 9 12 15 6" {...s} />
        </Svg>
      );
    case 'chevD':
      return (
        <Svg {...props}>
          <Polyline points="6 9 12 15 18 9" {...s} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...props}>
          <Line x1="18" y1="6" x2="6" y2="18" {...s} />
          <Line x1="6" y1="6" x2="18" y2="18" {...s} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" {...s} />
          <Line x1="5" y1="12" x2="19" y2="12" {...s} />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="5" {...sf} />
          <Line x1="12" y1="1" x2="12" y2="3" {...s} />
          <Line x1="12" y1="21" x2="12" y2="23" {...s} />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" {...s} />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" {...s} />
          <Line x1="1" y1="12" x2="3" y2="12" {...s} />
          <Line x1="21" y1="12" x2="23" y2="12" {...s} />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" {...s} />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" {...s} />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...props}>
          <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" {...sf} />
        </Svg>
      );
    case 'rain':
      return (
        <Svg {...props}>
          <Line x1="16" y1="13" x2="16" y2="21" {...s} />
          <Line x1="8" y1="13" x2="8" y2="21" {...s} />
          <Line x1="12" y1="15" x2="12" y2="23" {...s} />
          <Path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" {...s} />
        </Svg>
      );
    case 'ocean':
      return (
        <Svg {...props}>
          <Path d="M2 12s2-4 5-4 5 4 8 4 5-4 5-4" {...s} />
          <Path d="M2 18s2-4 5-4 5 4 8 4 5-4 5-4" {...s} />
          <Path d="M2 6s2-4 5-4 5 4 8 4 5-4 5-4" {...s} />
        </Svg>
      );
    case 'forest':
      return (
        <Svg {...props}>
          <Path d="M12 2L8 9h3l-4 6h5v5h2v-5h5l-4-6h3L12 2z" {...sf} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" {...sf} />
          <Path d="M13.73 21a2 2 0 01-3.46 0" {...s} />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...props}>
          <Polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            {...sf}
          />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Polyline points="12 6 12 12 16 14" {...s} />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...props}>
          <Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" {...sf} />
          <Path d="M5 3l.5 2L7 5.5 5.5 6 5 8l-.5-2L3 5.5 4.5 5 5 3z" {...sf} />
          <Path d="M19 15l.5 2 1.5.5-1.5.5-.5 2-.5-2L17 17.5l1.5-.5.5-2z" {...sf} />
        </Svg>
      );
    case 'arrowR':
      return (
        <Svg {...props}>
          <Line x1="5" y1="12" x2="19" y2="12" {...s} />
          <Polyline points="12 5 19 12 12 19" {...s} />
        </Svg>
      );
    case 'arrowL':
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" {...s} />
          <Polyline points="12 5 5 12 12 19" {...s} />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="3" {...s} />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" {...s} />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Circle cx="12" cy="12" r="6" {...s} />
          <Circle cx="12" cy="12" r="2" {...sf} />
        </Svg>
      );
    case 'mute':
      return (
        <Svg {...props}>
          <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" {...sf} />
          <Line x1="23" y1="9" x2="17" y2="15" {...s} />
          <Line x1="17" y1="9" x2="23" y2="15" {...s} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...props}>
          <Rect x="5" y="11" width="14" height="10" rx="2" {...s} />
          <Path d="M8 11V7a4 4 0 018 0v4" {...s} />
          <Circle cx="12" cy="16" r="1" fill={color} stroke="none" />
        </Svg>
      );
    case 'unlock':
      return (
        <Svg {...props}>
          <Rect x="5" y="11" width="14" height="10" rx="2" {...s} />
          <Path d="M8 11V7a4 4 0 018 0" {...s} />
          <Path d="M16 7h3" {...s} />
          <Circle cx="12" cy="16" r="1" fill={color} stroke="none" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...props}>
          <Rect x="2" y="4" width="20" height="16" rx="2" {...s} />
          <Polyline points="2,4 12,13 22,4" {...s} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...props}>
          <Rect x="3" y="4" width="18" height="18" rx="2" {...s} />
          <Line x1="3" y1="9" x2="21" y2="9" {...s} />
          <Line x1="8" y1="2" x2="8" y2="6" {...s} />
          <Line x1="16" y1="2" x2="16" y2="6" {...s} />
        </Svg>
      );
    case 'feather':
      return (
        <Svg {...props}>
          <Path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" {...sf} />
          <Line x1="16" y1="8" x2="2" y2="22" {...s} />
          <Line x1="17.5" y1="15" x2="9" y2="15" {...s} />
        </Svg>
      );
    case 'download':
      return (
        <Svg {...props}>
          <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" {...s} />
          <Polyline points="7 10 12 15 17 10" {...s} />
          <Line x1="12" y1="15" x2="12" y2="3" {...s} />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="12" y1="16" x2="12" y2="12" {...s} />
          <Circle cx="12" cy="8" r="1" fill={color} stroke="none" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...props}>
          <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" {...s} />
          <Path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" {...s} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...props}>
          <Polyline points="3 6 5 6 21 6" {...s} />
          <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" {...s} />
          <Line x1="10" y1="11" x2="10" y2="17" {...s} />
          <Line x1="14" y1="11" x2="14" y2="17" {...s} />
        </Svg>
      );
    default:
      return null;
  }
}

// Icon is pure on its props and rendered very heavily across every screen.
export default React.memo(Icon);
