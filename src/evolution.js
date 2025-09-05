// src/evolution.js - Evolution popup and animation system
import {showOverlay, hideOverlay} from './overlays.js';
import {drawSprite, getSpriteForLineAndLevel} from './sprites.js';
import {playEvolutionEffect} from './ui.js';

// Show dramatic evolution sequence
export function showEvolutionPopup(prevLevel, newLevel, prevLine, newLine, prevStage, newStage) {
  const oldSprite = getSpriteForLineAndLevel(prevLine, prevLevel);
  const newSprite = getSpriteForLineAndLevel(newLine, newLevel);
  
  const isLineChange = prevLine !== newLine;
  const isLevelUp = newLevel > prevLevel;
  
  let title = "Level Up!";
  let subtitle = `Reached Level ${newLevel}`;
  
  if (isLineChange && isLevelUp) {
    title = "🧬 EVOLUTION!";
    subtitle = `${oldSprite} ➜ ${newSprite}`;
  } else if (isLevelUp && newStage !== prevStage) {
    title = "🌟 EVOLUTION!";
    subtitle = `${oldSprite} ➜ ${newSprite}`;
  }

  const html = `
    <div class="evolution-popup">
      <style>
        .evolution-popup {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #1a3f2a 0%, #29e37d 50%, #15b565 100%);
          border-radius: 16px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .evolution-popup::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          );
          animation: evolutionShine 2s ease-in-out;
          pointer-events: none;
        }
        @keyframes evolutionShine {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(0%) translateY(0%); }
        }
        .evolution-sprites {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 20px 0;
        }
        .evolution-arrow {
          font-size: 24px;
          animation: evolutionPulse 1s ease-in-out infinite;
        }
        @keyframes evolutionPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        .evolution-sprite {
          width: 64px;
          height: 64px;
          border: 2px solid rgba(255,255,255,0.8);
          border-radius: 12px;
          background: rgba(255,255,255,0.9);
          image-rendering: pixelated;
        }
        .evolution-stats {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
          font-family: ui-monospace, monospace;
          font-size: 14px;
        }
        .evolution-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .evolution-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 16px;
        }
      </style>
      
      <div class="evolution-title">${title}</div>
      <div class="evolution-subtitle">${subtitle}</div>
      
      <div class="evolution-sprites">
        <canvas class="evolution-sprite" id="oldSprite" width="64" height="64"></canvas>
        <div class="evolution-arrow">➜</div>
        <canvas class="evolution-sprite" id="newSprite" width="64" height="64"></canvas>
      </div>
      
      <div class="evolution-stats">
        <div>Stage: ${prevStage} ➜ ${newStage}</div>
        <div>Line: ${prevLine} ➜ ${newLine}</div>
        <div>Level: ${prevLevel} ➜ ${newLevel}</div>
      </div>
      
      <button class="btn" id="evolutionOk" style="margin-top: 16px; background: rgba(255,255,255,0.9); color: #1a3f2a;">
        Amazing! ✨
      </button>
    </div>
  `;
  
  showOverlay(html);
  
  // Draw the sprites
  setTimeout(() => {
    try {
      const oldCanvas = document.getElementById('oldSprite');
      const newCanvas = document.getElementById('newSprite');
      
      if (oldCanvas && newCanvas) {
        const oldCtx = oldCanvas.getContext('2d');
        const newCtx = newCanvas.getContext('2d');
        
        drawSprite(oldCtx, oldSprite, 64);
        drawSprite(newCtx, newSprite, 64);
      }
    } catch (e) {
      console.warn('Failed to draw evolution sprites:', e);
    }
  }, 100);
  
  // Play evolution effect on main sprite
  setTimeout(() => {
    playEvolutionEffect();
  }, 200);
  
  // Close button
  document.getElementById('evolutionOk').onclick = () => {
    hideOverlay();
  };
  
  // Auto-close after 8 seconds if user doesn't interact
  setTimeout(() => {
    if (document.querySelector('.evolution-popup')) {
      hideOverlay();
    }
  }, 8000);
}

// Simpler level up notification for level-only increases
export function showLevelUpToast(newLevel) {
  const html = `
    <div class="level-up-toast">
      <style>
        .level-up-toast {
          text-align: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #29e37d, #15b565);
          border-radius: 12px;
          color: white;
          font-weight: bold;
          box-shadow: 0 4px 20px rgba(41, 227, 125, 0.4);
        }
        .level-up-title {
          font-size: 20px;
          margin-bottom: 8px;
        }
        .level-up-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
      </style>
      
      <div class="level-up-title">🌟 Level Up!</div>
      <div class="level-up-subtitle">Reached Level ${newLevel}</div>
      
      <button class="btn" id="levelUpOk" style="margin-top: 12px; background: rgba(255,255,255,0.9); color: #1a3f2a;">
        Great! 💪
      </button>
    </div>
  `;
  
  showOverlay(html);
  
  document.getElementById('levelUpOk').onclick = () => {
    hideOverlay();
  };
  
  // Auto-close after 4 seconds
  setTimeout(() => {
    if (document.querySelector('.level-up-toast')) {
      hideOverlay();
    }
  }, 4000);
}
