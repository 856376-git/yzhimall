// 内联 SVG 图标集:size 随父元素,颜色用 currentColor
const P = { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export default function Icon({ name, size, style, className }) {
  const s = { ...P, style: { fontSize: size, ...style }, className }
  switch (name) {
    case 'search':
      return (<svg {...s}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>)
    case 'cart':
      return (<svg {...s}><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2 3h2l3 13h12l2-7H6" /></svg>)
    case 'user':
      return (<svg {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)
    case 'plus':
      return (<svg {...s}><path d="M12 5v14M5 12h14" /></svg>)
    case 'minus':
      return (<svg {...s}><path d="M5 12h14" /></svg>)
    case 'chevron-down':
      return (<svg {...s}><path d="m6 9 6 6 6-6" /></svg>)
    case 'chevron-right':
      return (<svg {...s}><path d="m9 6 6 6-6 6" /></svg>)
    case 'arrow-left':
      return (<svg {...s}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>)
    case 'location':
      return (<svg {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>)
    case 'check':
      return (<svg {...s}><path d="M20 6 9 17l-5-5" /></svg>)
    case 'star':
      return (<svg {...s} fill="currentColor" stroke="none"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.1 3.1 1.6-6.7L2 8.9l6.9-.6Z" /></svg>)
    case 'lock':
      return (<svg {...s}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>)
    case 'phone':
      return (<svg {...s}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.6 3a2 2 0 0 1-.6 2L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.6l3 .6a2 2 0 0 1 1.7 2Z" /></svg>)
    case 'close':
      return (<svg {...s}><path d="M18 6 6 18M6 6l12 12" /></svg>)
    case 'heart':
      return (<svg {...s}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>)
    case 'monitor':
      return (<svg {...s}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>)
    case 'home':
      return (<svg {...s}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>)
    case 'shirt':
      return (<svg {...s}><path d="M20 5 16 2l-4 3-4-3L4 5l3 4v11h10V9l3-4Z" /></svg>)
    case 'box':
      return (<svg {...s}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>)
    case 'truck':
      return (<svg {...s}><path d="M1 4h13v12H1zM14 8h4l3 3v5h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>)
    case 'shield':
      return (<svg {...s}><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>)
    case 'mail':
      return (<svg {...s}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>)
    case 'return':
      return (<svg {...s}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></svg>)
   case 'price':
     return (<svg {...s}><path d="M20 12V8H4v4" /><path d="M4 12h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z" /><path d="M12 8V4M9 8V5M15 8V5" /></svg>)
    case 'grid':
      return (<svg {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>)
    case 'edit':
      return (<svg {...s}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>)
    case 'trash':
      return (<svg {...s}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4h8v2" /><path d="M10 11v6M14 11v6" /></svg>)
    case 'eye':
      return (<svg {...s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>)
    default:
      return (<svg {...s}><circle cx="12" cy="12" r="9" /></svg>)
  }
}
