import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { GameMode } from './src/engine/gameEngine';
import { Achievement } from './src/engine/storage';

type Screen =
  | { name: 'home' }
  | { name: 'game'; mode: GameMode }
  | { name: 'gameover'; score: number; level: number; mode: GameMode; achievements: Achievement[] }
  | { name: 'settings' }
  | { name: 'stats' }
  | { name: 'achievements' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const renderScreen = () => {
    switch (screen.name) {
      case 'home':
        return (
          <HomeScreen
            onStartGame={(mode) => setScreen({ name: 'game', mode })}
            onOpenStats={() => setScreen({ name: 'stats' })}
            onOpenSettings={() => setScreen({ name: 'settings' })}
            onOpenAchievements={() => setScreen({ name: 'achievements' })}
          />
        );
      case 'game':
        return (
          <GameScreen
            mode={screen.mode}
            onGameOver={(score, level, achievements) =>
              setScreen({ name: 'gameover', score, level, mode: screen.mode, achievements })
            }
            onBack={() => setScreen({ name: 'home' })}
          />
        );
      case 'gameover':
        return (
          <GameOverScreen
            score={screen.score}
            level={screen.level}
            mode={screen.mode}
            newAchievements={screen.achievements}
            onPlayAgain={() => setScreen({ name: 'game', mode: screen.mode })}
            onHome={() => setScreen({ name: 'home' })}
          />
        );
      case 'settings':
        return <SettingsScreen onBack={() => setScreen({ name: 'home' })} />;
      case 'stats':
        return <StatsScreen onBack={() => setScreen({ name: 'home' })} />;
      case 'achievements':
        return <StatsScreen onBack={() => setScreen({ name: 'home' })} showAchievements />;
    }
  };

  return (
    <>
      <StatusBar style="light" />
      {renderScreen()}
    </>
  );
}
