import React from 'react';
import { CardGeometry } from '../core/Geometry';
import { Renderer } from '../core/Renderer';
import { PrismItem } from '../types/Item';
import { PrismConfig } from '../types/Prism';

export interface PrismCardProps {
  item: PrismItem;
  geometry: CardGeometry;
  config: PrismConfig;
  isActive: boolean;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  renderCard?: (item: PrismItem, meta: { isActive: boolean; depth: number }) => React.ReactNode;
}

export function PrismCard({
  item,
  geometry,
  config,
  isActive,
  onClick,
  onHoverStart,
  onHoverEnd,
  renderCard,
}: PrismCardProps) {
  const style = Renderer.computeStyle(geometry, config);
  const width = config.cardWidth ?? 220;
  const height = config.cardHeight ?? 300;

  return (
    <div
      className="prism-card"
      style={{
        width,
        height,
        marginTop: -height / 2,
        marginLeft: -width / 2,
        transform: style.transform,
        opacity: style.opacity,
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents,
      }}
      role="tab"
      aria-selected={isActive}
      aria-label={item.title ?? item.id}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="prism-card-face" style={{ filter: style.filter, boxShadow: style.boxShadow }}>
        {renderCard ? renderCard(item, { isActive, depth: geometry.depth }) : <DefaultCardContent item={item} />}
      </div>
    </div>
  );
}

export function DefaultCardContent({ item }: { item: PrismItem }) {
  return (
    <>
      {item.thumbnail ? (
        <img className="prism-card-thumb" src={item.thumbnail} alt="" />
      ) : (
        <div className="prism-card-thumb placeholder" />
      )}
      <div className="prism-card-text-content">
        {item.title && <div className="prism-card-title">{item.title}</div>}
        {item.subtitle && <div className="prism-card-sub">{item.subtitle}</div>}
      </div>
    </>
  );
}
