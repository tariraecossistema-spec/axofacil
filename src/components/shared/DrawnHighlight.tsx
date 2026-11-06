import React, { useId } from 'react';

interface DrawnHighlightProps {
  children: React.ReactNode;
  type?: 'underline' | 'straight' | 'badge' | 'vai-e-volta' | 'box' | 'circle' | 'strike' | 'strike-through' | 'rainbow-sweep' | string;
  variant?: 'underline' | 'straight' | 'badge' | 'vai-e-volta' | 'box' | 'circle' | 'strike' | 'strike-through' | 'rainbow-sweep' | string;
  color?: string; // Default dark/brand color
  gradient?: boolean; // Whether to use a clean two-tone or metallic gold gradient
  className?: string;
  strokeWidth?: number;
  animated?: boolean;
  padding?: number;
}

/**
 * Realce Gráfico com Linha Reta Contínua ("Vai e Volta")
 * Renderiza uma linha estritamente reta por baixo do texto,
 * com animação contínua e intermitente da esquerda para a direita e depois da direita para a esquerda,
 * posicionada estritamente abaixo da tipografia (z-0, bottom-0) sem cobrir o produto ou imagem.
 */
export default function DrawnHighlight({
  children,
  color = '#103B75',
  gradient = false,
  className = '',
  strokeWidth = 2.5,
  animated = true
}: DrawnHighlightProps) {
  const gradId = useId().replace(/:/g, '-');
  const strokeColor = gradient ? `url(#grad-straight-${gradId})` : color;

  return (
    <span className={`relative inline-block pb-1.5 px-0.5 align-baseline ${className}`}>
      {/* Texto sempre na camada superior */}
      <span className="relative z-10">{children}</span>
      
      {/* SVG da linha reta estritamente abaixo do texto */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[3px] pointer-events-none z-0 overflow-visible"
        viewBox="0 0 100 3"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {gradient && (
          <defs>
            <linearGradient id={`grad-straight-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0B254B" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0B254B" />
            </linearGradient>
          </defs>
        )}
        
        {/* Linha de base discreta e estática em tom suave de cinza/azul */}
        <line
          x1="0"
          y1="1.5"
          x2="100"
          y2="1.5"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.18"
        />

        {/* Linha reta animada que corre da esquerda para a direita, e volta da direita para a esquerda */}
        <line
          x1="0"
          y1="1.5"
          x2="100"
          y2="1.5"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength="100"
          className={animated ? 'straight-line-sweep' : ''}
        />
      </svg>
    </span>
  );
}

