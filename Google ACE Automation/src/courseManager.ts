import { Page } from '@playwright/test';
import { login } from '../utils/login';

export interface CourseModule {
  title: string;
  link: string;
  completed?: boolean;
}

export class CourseManager {
  private page: Page;
  private modules: CourseModule[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async initialize() {
    await login(this.page);
    await this.loadModules();
  }

  private async loadModules() {
    const fs = require('fs');
    const path = require('path');
    const modulesPath = path.join(__dirname, '..', 'modules.json');
    
    if (fs.existsSync(modulesPath)) {
      const data = fs.readFileSync(modulesPath, 'utf8');
      this.modules = JSON.parse(data).filter((m: CourseModule) => m.link);
    }
  }

  async completeAllCourses() {
    for (const module of this.modules) {
      if (!module.completed) {
        await this.completeCourse(module.link);
        module.completed = true;
      }
    }
  }

  private async completeCourse(courseUrl: string) {
    await this.page.goto(courseUrl);
    await this.page.waitForLoadState('networkidle');
    
    const resumeButton = this.page.getByRole('link', { name: 'Resume course' });
    if (await resumeButton.isVisible()) {
      await resumeButton.click();
      await this.completeAllVideos();
    }
  }

  private async completeAllVideos() {
    await this.expandAllModules();
    
    let incompleteVideos = this.page.locator(
      'ql-course-outline a[href*="/video/"]:not([data-complete="true"])'
    );
    
    while (await incompleteVideos.count() > 0) {
      const video = incompleteVideos.first();
      await video.click();
      
      const completeButton = this.page.getByRole('button', { name: 'Mark as Completed' });
      await completeButton.waitFor({ state: 'visible' });
      await completeButton.click();
      
      await this.page.goBack();
      await this.page.waitForLoadState('networkidle');
      
      incompleteVideos = this.page.locator(
        'ql-course-outline a[href*="/video/"]:not([data-complete="true"])'
      );
    }
  }

  private async expandAllModules() {
    const moduleHeaders = this.page.locator('ql-course-outline .ql-module-header');
    const count = await moduleHeaders.count();
    
    for (let i = 0; i < count; i++) {
      const header = moduleHeaders.nth(i);
      const expandIcon = header.locator('ql-icon[icon="expand_more"]');
      if (await expandIcon.isVisible()) {
        await header.click();
      }
    }
  }
}