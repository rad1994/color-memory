import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { GameMode } from './src/engine/gameEngine';
import { Achievement, seedForDate, todayKey } from './src/engine/storage';
import { ThemeProvider } from './src/theme/ThemeContext';

type Screen =
  | { name: 'home' }
  | { name: 'game'; mode: GameMode; seed: number | null }
  | {
      name: 'gameover';
      score: number;
      level: number;
      mode: GameMode;
      achievements: Achievement[];
      isNewRecord: boolean;
    }
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
            onStartGame={(mode) => setScreen({ name: 'game', mode, seed: null })}
            key="home"
            onStartDaily={() =>
              setScreen({ name: 'game', mode: 'daily', seed: seedForDate(todayKey()) })
            }
            onOpenStats={() => setScreen({ name: 'stats' })}
            onOpenSettings={() => setScreen({ name: 'settings' })}
            onOpenAchievements={() => setScreen({ name: 'achievements' })}
          />
        );
      case 'game':
        return (
          <GameScreen
            // Remounts on replay so a finished run never carries over.
            key={`${screen.mode}-${screen.seed ?? 'random'}`}
            mode={screen.mode}
            seed={screen.seed}
            onGameOver={(score, level, achievements, isNewRecord) =>
              setScreen({ name: 'gameover', score, level, mode: screen.mode, achievements, isNewRecord })
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
            isNewRecord={screen.isNewRecord}
            // The Daily is one attempt per day, so there is nothing to replay.
            onPlayAgain={
              screen.mode === 'daily'
                ? undefined
                : () => setScreen({ name: 'game', mode: screen.mode, seed: null })
            }
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
    <ThemeProvider>
      <StatusBar style="light" />
      {renderScreen()}
    </ThemeProvider>
  );
}
