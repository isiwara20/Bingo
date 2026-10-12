# Screen Component Tests

Jest tests for BinGo mobile app screen components.

## Test Files

### RecyclingGuideScreen.test.js
Comprehensive tests for the Recycling Guide screen covering:
- **Rendering**: Header, tabs, loading states
- **Data Loading**: API integration, error handling  
- **Tab Navigation**: Explore, Learn, Detective, Stories, My Progress
- **User Interactions**: Category exploration, filtering, navigation
- **Edge Cases**: Empty data, null values, missing fields
- **Accessibility**: ARIA roles, labels

**Test Count**: 29 tests covering all major functionality

### CollectionScheduleScreen.test.js  
Comprehensive tests for the Waste Collection Schedule screen covering:
- **Rendering**: Header, tabs, area picker, loading states
- **Data Loading**: Schedule fetching, area switching, error handling
- **Tab Navigation**: Today, Upcoming, Calendar, History
- **Today Tab**: Greetings, week strip, collection cards, reminders
- **Upcoming Tab**: Stats, upcoming collections, holiday schedule
- **Calendar Tab**: Month navigation, day selection, collection indicators
- **History Tab**: Past collections, filtering, statistics
- **Edge Cases**: Empty schedules, missing fields
- **Accessibility**: Accessible buttons, labels

**Test Count**: 41 tests covering all major functionality

## Running Tests

```bash
# Run all screen tests
npm run test:screens

# Run specific test file
npm test -- RecyclingGuideScreen.test.js
npm test -- CollectionScheduleScreen.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Each test file follows this structure:
1. **Setup**: Mock services, navigation, and test data
2. **Test Suites**: Grouped by feature area
3. **Assertions**: Using React Native Testing Library matchers
4. **Cleanup**: Automatic cleanup between tests

## Mocking

Tests use mocked versions of:
- `recyclingService` - Guide and progress data
- `scheduleService` - Collection schedule data
- `AuthContext` - User authentication state
- `Navigation` - React Navigation
- `@env` - Environment variables

## Coverage Goals

- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

## Best Practices

1. **Use `waitFor`** for async operations
2. **Mock external dependencies** at module level
3. **Test user interactions** not implementation details
4. **Use accessibility queries** when possible
5. **Keep tests focused** on single behaviors
6. **Use descriptive test names**
7. **Test edge cases** and error scenarios

## Common Patterns

### Testing User Interactions
```javascript
const { getByText } = render(<MyScreen />);
await waitFor(() => {
  fireEvent.press(getByText('Button'));
});
expect(mockFunction).toHaveBeenCalled();
```

### Testing Data Loading
```javascript
const mockData = [...];
getService.mockResolvedValue(mockData);
render(<MyScreen />);
await waitFor(() => {
  expect(getService).toHaveBeenCalled();
});
```

### Testing Error Handling
```javascript
getService.mockRejectedValue(new Error('Error'));
render(<MyScreen />);
await waitFor(() => {
  expect(queryByText('Loading...')).toBeFalsy();
});
```

## Troubleshooting

### Tests timing out
- Increase timeout in test or jest.config.js
- Check for unresolved promises
- Verify all async operations complete

### Mock not working
- Ensure mock is defined before importing component
- Check mock path matches actual import
- Use `jest.clearAllMocks()` in beforeEach

### Element not found
- Use `waitFor` for async rendering
- Check element exists in rendered output
- Use `screen.debug()` to see rendered tree

## Adding New Tests

1. Create test file: `ComponentName.test.js`
2. Import component and dependencies
3. Mock external services
4. Write test suites for each feature
5. Run tests and verify coverage
6. Update this README

## Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
