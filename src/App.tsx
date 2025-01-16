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

  const animationSpeed = queryParams.get('animationSpeed')
    ? parseFloat(queryParams.get('animationSpeed')!)
    : undefined;

  const body = document.querySelector('body');
  if (body) {
    body.classList.add(isDarkMode ? 'dark' : 'light');
    body.style.backgroundColor = customColors.background || '';
  }

  let classes = ['min-h-screen'];
  if (queryParams.get('centered') !== 'false') {
    classes = classes.concat(['flex', 'justify-center', 'items-center', 'p-4']);
  }

  return (
    <div className={classes.join(' ')}>
      <EnumerationDemo
        demoType={demoType}
        customColors={customColors}
        isDarkMode={isDarkMode}
        animationSpeed={animationSpeed}
      />
    </div>
  );
}

export default App;
