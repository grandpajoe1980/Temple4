import fs from 'fs';
import path from 'path';
import { PageTestResult, ButtonTestResult, UserRole } from './ui-test-base';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',     // Blocks core functionality
  HIGH = 'HIGH',             // Major feature broken
  MEDIUM = 'MEDIUM',         // Minor feature broken
  LOW = 'LOW',               // Cosmetic/UX issue
  INFO = 'INFO'              // Informational
}

/**
 * Error category
 */
export enum ErrorCategory {
  ACCESS = 'ACCESS',         // Permission/access issues
  NAVIGATION = 'NAVIGATION', // Navigation/routing issues
  INTERACTION = 'INTERACTION', // Button/click issues
  LOADING = 'LOADING',       // Page loading issues
  CONTENT = 'CONTENT',       // Content display issues
  AUTH = 'AUTH'              // Authentication issues
}

/**
 * Error entry in backlog
 */
export interface ErrorEntry {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  page: string;
  role: UserRole;
  button?: string;
  description: string;
  error: string;
  screenshot?: string;
  fixed: boolean;
  fixedAt?: string;
  notes?: string;
}

/**
 * Error backlog summary
 */
export interface ErrorBacklogSummary {
  total: number;
  fixed: number;
  remaining: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  byRole: Record<UserRole, number>;
}

/**
 * Manages error backlog for UI tests
 */
export class ErrorBacklogManager {
  private errors: ErrorEntry[] = [];
  private backlogPath: string;

  constructor(backlogPath: string = 'test-results/error-backlog.json') {
    this.backlogPath = backlogPath;
    this.loadBacklog();
  }

  /**
   * Load existing backlog from file
   */
  private loadBacklog(): void {
    try {
      if (fs.existsSync(this.backlogPath)) {
        const data = fs.readFileSync(this.backlogPath, 'utf-8');
        this.errors = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load backlog:', error);
      this.errors = [];
    }
  }

  /**
   * Save backlog to file
   */
  saveBacklog(): void {
    try {
      const dir = path.dirname(this.backlogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.backlogPath, JSON.stringify(this.errors, null, 2));
      console.log(`Backlog saved to ${this.backlogPath}`);
    } catch (error) {
      console.error('Failed to save backlog:', error);
    }
  }

  /**
   * Add error from page test result
   */
  addFromPageResult(result: PageTestResult): void {
    // Add page loading errors
    if (!result.loaded) {
      this.addError({
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.LOADING,
        page: result.page,
        role: result.role,
        description: 'Page failed to load',
        error: result.errors.join(', '),
        screenshot: result.screenshot
      });
    }

    // Add button errors
    for (const button of result.buttons) {
      if (button.error) {
        this.addError({
          severity: this.categorizeSeverity(button, result.page),
          category: this.categorizeError(button),
          page: result.page,
          role: result.role,
          button: button.button,
          description: `Button "${button.button}" failed`,
          error: button.error,
          screenshot: result.screenshot
        });
      }
    }
  }

  /**
   * Add a new error entry
   */
  addError(error: Omit<ErrorEntry, 'id' | 'fixed'>): void {
    const id = this.generateErrorId();
    const entry: ErrorEntry = {
      id,
      ...error,
      fixed: false
    };

    // Check if similar error already exists
    const existing = this.errors.find(e => 
      e.page === entry.page &&
      e.role === entry.role &&
      e.button === entry.button &&
      !e.fixed
    );

    if (!existing) {
      this.errors.push(entry);
    }
  }

  /**
   * Mark error as fixed
   */
  markFixed(errorId: string, notes?: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.fixed = true;
      error.fixedAt = new Date().toISOString();
      if (notes) error.notes = notes;
    }
  }

  /**
   * Get summary of backlog
   */
  getSummary(): ErrorBacklogSummary {
    const summary: ErrorBacklogSummary = {
      total: this.errors.length,
      fixed: this.errors.filter(e => e.fixed).length,
      remaining: this.errors.filter(e => !e.fixed).length,
      bySeverity: {
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.INFO]: 0
      },
      byCategory: {
        [ErrorCategory.ACCESS]: 0,
        [ErrorCategory.NAVIGATION]: 0,
        [ErrorCategory.INTERACTION]: 0,
        [ErrorCategory.LOADING]: 0,
        [ErrorCategory.CONTENT]: 0,
        [ErrorCategory.AUTH]: 0
      },
      byRole: {
        [UserRole.VISITOR]: 0,
        [UserRole.USER]: 0,
        [UserRole.TENANT_ADMIN]: 0,
        [UserRole.PLATFORM_ADMIN]: 0
      }
    };

    for (const error of this.errors.filter(e => !e.fixed)) {
      summary.bySeverity[error.severity]++;
      summary.byCategory[error.category]++;
      summary.byRole[error.role]++;
    }

    return summary;
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorEntry[] {
    return this.errors.filter(e => e.severity === severity && !e.fixed);
  }

  /**
   * Get all unfixed errors
   */
  getUnfixedErrors(): ErrorEntry[] {
    return this.errors.filter(e => !e.fixed);
  }

  /**
   * Generate human-readable report
   */
  generateReport(): string {
    const summary = this.getSummary();
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('UI TEST ERROR BACKLOG');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(`Total Errors: ${summary.total}`);
    lines.push(`Fixed: ${summary.fixed}`);
    lines.push(`Remaining: ${summary.remaining}`);
    lines.push('');

    lines.push('BY SEVERITY:');
    Object.entries(summary.bySeverity).forEach(([sev, count]) => {
      if (count > 0) lines.push(`  ${sev}: ${count}`);
    });
    lines.push('');

    lines.push('BY CATEGORY:');
    Object.entries(summary.byCategory).forEach(([cat, count]) => {
      if (count > 0) lines.push(`  ${cat}: ${count}`);
    });
    lines.push('');

    lines.push('BY ROLE:');
    Object.entries(summary.byRole).forEach(([role, count]) => {
      if (count > 0) lines.push(`  ${role}: ${count}`);
    });
    lines.push('');

    // Group errors by severity
    for (const severity of [ErrorSeverity.CRITICAL, ErrorSeverity.HIGH, ErrorSeverity.MEDIUM, ErrorSeverity.LOW]) {
      const errors = this.getErrorsBySeverity(severity);
      if (errors.length > 0) {
        lines.push('='.repeat(80));
        lines.push(`${severity} ERRORS (${errors.length})`);
        lines.push('='.repeat(80));
        lines.push('');

        errors.forEach((error, i) => {
          lines.push(`${i + 1}. [${error.id}] ${error.description}`);
          lines.push(`   Page: ${error.page}`);
          lines.push(`   Role: ${error.role}`);
          lines.push(`   Category: ${error.category}`);
          if (error.button) lines.push(`   Button: ${error.button}`);
          lines.push(`   Error: ${error.error}`);
          if (error.screenshot) lines.push(`   Screenshot: ${error.screenshot}`);
          lines.push('');
        });
      }
    }

    return lines.join('\n');
  }

  /**
   * Save report to file
   */
  saveReport(filename: string = 'test-results/error-backlog-report.txt'): void {
    const report = this.generateReport();
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filename, report);
    console.log(`Report saved to ${filename}`);
  }

  /**
   * Generate error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR-${timestamp}-${random}`;
  }

  /**
   * Categorize error severity based on button and page
   */
  private categorizeSeverity(button: ButtonTestResult, page: string): ErrorSeverity {
    const buttonLower = button.button.toLowerCase();
    
    // Critical: Core auth and navigation
    if (buttonLower.includes('login') || buttonLower.includes('sign in') || 
        buttonLower.includes('register') || buttonLower.includes('sign up')) {
      return ErrorSeverity.CRITICAL;
    }

    // Critical: Core tenant operations
    if (buttonLower.includes('create tenant') || buttonLower.includes('join')) {
      return ErrorSeverity.CRITICAL;
    }

    // High: Major features
    if (buttonLower.includes('post') || buttonLower.includes('event') || 
        buttonLower.includes('message') || buttonLower.includes('donate')) {
      return ErrorSeverity.HIGH;
    }

    // High: Admin operations
    if (page.includes('/admin') || buttonLower.includes('admin')) {
      return ErrorSeverity.HIGH;
    }

    // Medium: Secondary features
    if (buttonLower.includes('edit') || buttonLower.includes('delete') || 
        buttonLower.includes('save') || buttonLower.includes('submit')) {
      return ErrorSeverity.MEDIUM;
    }

    // Low: Navigation and viewing
    return ErrorSeverity.LOW;
  }

  /**
   * Categorize error type
   */
  private categorizeError(button: ButtonTestResult): ErrorCategory {
    const error = button.error?.toLowerCase() || '';
    const buttonLower = button.button.toLowerCase();

    if (error.includes('not visible') || error.includes('not found')) {
      return ErrorCategory.CONTENT;
    }

    if (error.includes('timeout') || error.includes('navigation')) {
      return ErrorCategory.NAVIGATION;
    }

    if (buttonLower.includes('login') || buttonLower.includes('sign') || 
        buttonLower.includes('logout')) {
      return ErrorCategory.AUTH;
    }

    if (error.includes('forbidden') || error.includes('unauthorized')) {
      return ErrorCategory.ACCESS;
    }

    return ErrorCategory.INTERACTION;
  }
}
