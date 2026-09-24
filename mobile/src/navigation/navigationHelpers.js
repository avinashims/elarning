/** After sign-in / sign-up, leave auth screens and open the main app. */
export function resetToMainApp(navigation, initialTab = 'Home') {
  const tabs = ['Home', 'Courses', 'Learning', 'Profile'];
  const tabIndex = Math.max(0, tabs.indexOf(initialTab));

  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'Main',
        state: {
          index: tabIndex,
          routes: tabs.map((name) => ({ name })),
        },
      },
    ],
  });
}
