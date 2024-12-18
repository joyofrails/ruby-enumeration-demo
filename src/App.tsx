import EnumerationDemo, { EnumerationType } from './components/EnumerationDemo';

function App() {
  const queryParams = new URLSearchParams(window.location.search);

  let demoType: EnumerationType | undefined;

  if (
    queryParams.get('demoType') === 'eager' ||
    queryParams.get('demoType') === 'lazy'
  ) {
    demoType = queryParams.get('demoType') as EnumerationType;
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <EnumerationDemo demoType={demoType} />
    </div>
  );
}

export default App;
