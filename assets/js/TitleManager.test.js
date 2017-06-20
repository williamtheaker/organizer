import TitleManager, { titles } from './TitleManager'

test('Titles', () => {
  const titleManager = new TitleManager();
  const setter = jest.fn();
  titleManager.register(setter);
  expect(titleManager.title).toMatch("");
  expect(titleManager.subtitle).toMatch("");

  titleManager.setTitle("Title", "Subtitle");
  expect(titleManager.title).toMatch("Title");
  expect(titleManager.subtitle).toMatch("Subtitle");

  titleManager.setSubtitle("Another Subtitle");
  expect(titleManager.title).toMatch("Title");
  expect(titleManager.subtitle).toMatch("Another Subtitle");

  titleManager.setTitle("", "");
  expect(titleManager.title).toMatch("");
  expect(titleManager.subtitle).toMatch("");

  expect(setter).toHaveBeenCalledTimes(3);
})
