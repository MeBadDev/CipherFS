import { useState, useEffect, useRef, useMemo } from 'react';
import type { Group, GroupItem, DecryptedGroup } from '../types';

interface MindMapProps {
  repoName: string;
  groups: Group[];
  decryptedGroups: DecryptedGroup[];
  decryptionStatus: Record<string, 'pending' | 'decrypting' | 'success' | 'failed'>;
  onPassphraseChange: (passphrase: string) => void;
  onPassphraseSubmit: () => void;
  onItemClick: (groupId: string, item: GroupItem) => void;
  onGroupClick: (groupId: string | null) => void;
  onDeleteItem?: (groupId: string, itemId: string) => void;
  isDecrypting: boolean;
  passphrase: string;
  isAdmin?: boolean;
  focusedNodeId?: string | null;
  isSidebarCollapsed?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Node extends Point {
  id: string;
  type: 'center' | 'group' | 'item';
  label: string;
  status?: 'pending' | 'decrypting' | 'success' | 'failed';
  parent?: Point; // For drawing lines
  data?: Group | (GroupItem & { groupId: string });
}

// ASCII Scramble Component
const AsciiText = ({ text, scrambling, locked }: { text: string; scrambling: boolean; locked: boolean }) => {
  const [display, setDisplay] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

  useEffect(() => {
    if (!scrambling) {
      setDisplay(text);
      return;
    }

    const interval = setInterval(() => {
      setDisplay(
        text.split('').map((char) => {
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
    }, 50);

    return () => clearInterval(interval);
  }, [scrambling, text]);

  if (locked && !scrambling) {
    return <span className="font-mono text-slate-500">[LOCKED] {text}</span>;
  }

  return <span className="font-mono">{display}</span>;
};

export function MindMap({
  repoName,
  groups,
  decryptedGroups,
  decryptionStatus,
  onPassphraseChange,
  onPassphraseSubmit,
  onItemClick,
  onGroupClick,
  onDeleteItem,
  isDecrypting,
  passphrase,
  isAdmin,
  focusedNodeId,
  isSidebarCollapsed = false
}: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
      return;
    }

    if (e.touches.length === 1) {
      setIsDragging(true);
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {

    if (e.touches.length === 1 && isDragging && lastTouchPos.current) {
      const deltaX = e.touches[0].clientX - lastTouchPos.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPos.current.y;
      
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDistance.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      const delta = distance - lastTouchDistance.current;
      const zoomFactor = delta * 0.005; // Adjust sensitivity
      
      setScale(s => Math.min(3, Math.max(0.1, s + zoomFactor)));
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchPos.current = null;
    lastTouchDistance.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
      return;
    }
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid zooming if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === '=' || e.key === '+') {
        setScale(s => Math.min(3, s + 0.1));
      } else if (e.key === '-' || e.key === '_') {
        setScale(s => Math.max(0.1, s - 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate layout
  const nodes = useMemo(() => {
    const nodeList: Node[] = [];
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return [];

    const centerX = width / 2;
    const centerY = height / 2;

    // Center Node
    nodeList.push({
      id: 'center',
      type: 'center',
      label: repoName,
      x: centerX,
      y: centerY,
    });

    // 1. Calculate size of each group based on items
    const groupSizes = groups.map(group => {
      const decryptedGroup = decryptedGroups.find(g => g.id === group.id);
      const isDecrypted = !!decryptedGroup;
      
      if (!isDecrypted) {
        return { id: group.id, radius: 80, itemRadius: 0, itemCount: 0 }; 
      }

      const itemCount = decryptedGroup.items.length;
      const itemSpace = 160; // Increased space to account for item width
      const maxSpread = 220 * (Math.PI / 180); // Max 220 degrees spread
      
      // Calculate required radius to fit items
      const totalArc = Math.max(itemCount * itemSpace, 200);
      const itemRadius = Math.max(totalArc / maxSpread, 250);
      
      return { 
        id: group.id, 
        // Bounding radius includes the group node + item radius + item width allowance
        radius: itemRadius + 150, 
        itemRadius,
        itemCount
      };
    });

    // 2. Calculate layout radius for groups
    const padding = 60; // Gap between group bounding circles
    const totalCircumference = groupSizes.reduce((sum, g) => sum + (g.radius * 2) + padding, 0);
    
    const minLayoutRadius = Math.min(width, height) * 0.35;
    const layoutRadius = Math.max(totalCircumference / (2 * Math.PI), minLayoutRadius, 350);

    // 3. Position groups
    let currentAngle = -Math.PI / 2; // Start top

    groups.forEach((group) => {
      const size = groupSizes.find(s => s.id === group.id)!;
      
      // Calculate angular width proportional to size
      // If total circumference is small, we distribute evenly or use min size
      // Here we distribute the full 2PI proportional to required size
      const fraction = ((size.radius * 2) + padding) / Math.max(totalCircumference, 1);
      const angularWidth = fraction * 2 * Math.PI;
      
      // Place group at center of its sector
      const angle = currentAngle + (angularWidth / 2);
      
      const groupX = centerX + Math.cos(angle) * layoutRadius;
      const groupY = centerY + Math.sin(angle) * layoutRadius;

      const status = decryptionStatus[group.id] || 'pending';
      const isDecrypted = decryptedGroups.some(g => g.id === group.id);

      nodeList.push({
        id: group.id,
        type: 'group',
        label: group.name,
        x: groupX,
        y: groupY,
        status: status,
        parent: { x: centerX, y: centerY },
        data: group
      });

      // Item Nodes (if decrypted)
      if (isDecrypted) {
        const decryptedGroup = decryptedGroups.find(g => g.id === group.id);
        if (decryptedGroup && decryptedGroup.items.length > 0) {
          const items = decryptedGroup.items;
          const itemRadius = size.itemRadius;
          
          items.forEach((item, itemIndex) => {
            // Fan out items
            const itemSpace = 160;
            const totalItemArc = size.itemCount * itemSpace;
            const maxSpread = 220 * (Math.PI / 180);
            const spread = Math.min(totalItemArc / itemRadius, maxSpread);
            
            const startAngle = angle - spread / 2;
            const step = spread / (items.length > 1 ? items.length - 1 : 1);
            const itemAngle = items.length === 1 ? angle : startAngle + (itemIndex * step);

            const itemX = groupX + Math.cos(itemAngle) * itemRadius;
            const itemY = groupY + Math.sin(itemAngle) * itemRadius;

            nodeList.push({
              id: item.id,
              type: 'item',
              label: item.name,
              x: itemX,
              y: itemY,
              parent: { x: groupX, y: groupY },
              data: { ...item, groupId: group.id }
            });
          });
        }
      }
      
      currentAngle += angularWidth;
    });

    return nodeList;
  }, [dimensions, groups, decryptedGroups, decryptionStatus, repoName]);

  // Handle focus node
  useEffect(() => {
    if (!focusedNodeId) return;

    const targetNode = nodes.find(n => n.id === focusedNodeId);
    if (targetNode) {
      const { width, height } = dimensions;
      
      // Adjust center based on sidebar state
      // If sidebar is open (not collapsed), the visual center is shifted right by 160px (half of 320px sidebar)
      const sidebarOffset = isSidebarCollapsed ? 0 : 160;
      const centerX = (width / 2) + sidebarOffset;
      const centerY = height / 2;
      
      const originX = width / 2;
      const originY = height / 2;
      
      const targetPanX = centerX - originX * (1 - scale) - targetNode.x * scale;
      const targetPanY = centerY - originY * (1 - scale) - targetNode.y * scale;
      
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [focusedNodeId, nodes, dimensions, scale, isSidebarCollapsed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onPassphraseSubmit();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 overflow-hidden touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`absolute inset-0 w-full h-full origin-center ${!isDragging ? 'transition-transform duration-500 ease-out' : ''}`}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {nodes.map(node => {
          if (!node.parent) return null;
          return (
            <line
              key={`line-${node.id}`}
              x1={node.parent.x}
              y1={node.parent.y}
              x2={node.x}
              y2={node.y}
              stroke={node.type === 'item' ? '#94a3b8' : '#475569'}
              strokeWidth={node.type === 'item' ? 2 : 2}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Nodes Layer */}
      {nodes.map(node => {
        if (node.type === 'center') {
          const isFocused = focusedNodeId === 'center';
          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: node.x, top: node.y }}
            >
              <div className={`relative group grid place-items-center ${isFocused ? 'ring-4 ring-blue-500/50 rounded' : ''}`}>
                {/* Hidden span for auto-width */}
                <span className="col-start-1 row-start-1 invisible whitespace-pre px-6 py-3 text-xl font-bold border-2 border-transparent min-w-[200px]">
                  {passphrase || node.label}
                </span>
                <input
                  type="text"
                  value={passphrase}
                  onChange={(e) => onPassphraseChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onClick={() => onGroupClick(null)}
                  placeholder={node.label}
                  className="col-start-1 row-start-1 w-full h-full bg-slate-800 border-2 border-blue-500 text-white px-6 py-3 text-xl font-bold text-center min-w-[200px] focus:outline-none focus:border-blue-400 transition-all placeholder-slate-500"
                  autoFocus
                />
                {passphrase && !isDecrypting && (
                  <div className="absolute top-full left-0 right-0 text-center mt-2 text-slate-400 text-xs animate-pulse">
                    Press Enter to Decrypt
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (node.type === 'group') {
          const isDecrypting = node.status === 'decrypting';
          const isSuccess = node.status === 'success';
          const isFailed = node.status === 'failed';
          const isFocused = focusedNodeId === node.id;
          
          let borderColor = 'border-slate-600';
          let bgColor = 'bg-slate-800';
          
          if (isDecrypting) {
            borderColor = 'border-blue-500';
            bgColor = 'bg-slate-800';
          } else if (isSuccess) {
            borderColor = 'border-green-500';
            bgColor = 'bg-green-900';
          } else if (isFailed) {
            borderColor = 'border-red-900';
            bgColor = 'bg-slate-800';
          }

          return (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-500 cursor-pointer`}
              style={{ left: node.x, top: node.y }}
              onClick={() => onGroupClick(node.id)}
            >
              <div className={`
                px-4 py-2 rounded shadow-lg border-2 ${borderColor} ${bgColor}
                hover:scale-105 transition-transform duration-200
                ${isFocused ? 'ring-4 ring-blue-500/50 scale-110' : ''}
              `}>
                <div className="text-white font-mono text-sm whitespace-nowrap flex items-center gap-2">
                  <AsciiText 
                    text={node.label} 
                    scrambling={isDecrypting} 
                    locked={!isSuccess && !isDecrypting}
                  />
                  {isSuccess && <span className="text-green-400">[OK]</span>}
                </div>
              </div>
            </div>
          );
        }

        if (node.type === 'item') {
          const item = node.data as GroupItem & { groupId: string };
          const isFocused = focusedNodeId === node.id;
          const getIcon = () => {
            switch (item.type) {
              case 'file': return '📄';
              case 'link': return '🔗';
              case 'text': return '📝';
            }
          };

          return (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex hover:scale-105 transition-transform duration-200 ${isFocused ? 'scale-110 z-30' : ''}`}
              style={{ left: node.x, top: node.y }}
            >
              <button
                onClick={() => onItemClick(item.groupId, item)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 
                  bg-slate-800 border border-slate-600
                  hover:bg-slate-700 hover:border-blue-400
                  transition-colors duration-200 cursor-pointer
                  text-xs text-slate-300 hover:text-white
                  whitespace-nowrap
                  ${isAdmin && onDeleteItem ? 'border-r-0' : ''}
                  ${isFocused ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-700 text-white' : ''}
                `}
                title={item.name}
              >
                <span>{getIcon()}</span>
                <span className="truncate max-w-[150px]">{item.name}</span>
              </button>
              {isAdmin && onDeleteItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.groupId, item.id);
                  }}
                  className="
                    px-2 bg-red-900 border border-red-800 
                    hover:bg-red-800 text-red-200
                    transition-colors cursor-pointer flex items-center justify-center
                  "
                  title="Delete item"
                >
                  [X]
                </button>
              )}
            </div>
          );
        }

        return null;
      })}
      </div>

      {/* Zoom Controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 z-50">
        <button 
          onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-mono text-lg"
        >
          -
        </button>
        <button 
          onClick={() => {
            setScale(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-3 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-mono text-sm min-w-[60px]"
        >
          {Math.round(scale * 100)}%
        </button>
        <button 
          onClick={() => setScale(s => Math.min(3, s + 0.1))}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-mono text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
