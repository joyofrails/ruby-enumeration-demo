import EnumerationDemo, {
  EnumerationType,
  ThemeColors,
} from './components/EnumerationDemo';

function App() {
  const queryParams = new URLSearchParams(window.location.search);

  let demoType: EnumerationType | undefined;

  if (
    queryParams.get('demoType') === 'eager' ||
    queryParams.get('demoType') === 'lazy'
  ) {
    demoType = queryParams.get('demoType') as EnumerationType;
  }

  const customColors = {} as ThemeColors;
  customColors.background = queryParams.get('background') || undefined;
  customColors.primary = queryParams.get('primary') || undefined;
  customColors.secondary = queryParams.get('secondary') || undefined;
  customColors.accent = queryParams.get('accent') || undefined;
  customColors.gridLines = queryParams.get('gridLines') || undefined;

  const isDarkMode = queryParams.get('isDarkMode') === 'true';

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <EnumerationDemo
        demoType={demoType}
        customColors={customColors}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
