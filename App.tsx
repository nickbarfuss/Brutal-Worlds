
import React from 'react';
import GameView from './components/GameView';
import ThemeInjector from './components/ThemeInjector';

const App: React.FC = () => {
  return (
    <>
      <ThemeInjector />
      <GameView />
    </>
  );
};

export default App;