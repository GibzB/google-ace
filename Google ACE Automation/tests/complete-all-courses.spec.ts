import { test } from './fixtures';
import { CourseManager } from '../src/courseManager';

test.describe('Complete All Courses', () => {
  test('complete all Google ACE courses automatically', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout
    
    const courseManager = new CourseManager(page);
    await courseManager.initialize();
    await courseManager.completeAllCourses();
    
    console.log('All courses completed successfully!');
  });
});