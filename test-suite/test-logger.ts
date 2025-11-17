/**
 * Test Logger
 * Logs all test results, errors, and issues to files for analysis
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  timestamp: string;
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'SKIP';
  duration?: number;
  error?: string;
  details?: any;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

export class TestLogger {
  private results: TestResult[] = [];
  private logDir: string;
  private currentTest: { name: string; startTime: number } | null = null;

  constructor(logDir: string = './test-results') {
    this.logDir = logDir;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  startTest(category: string, testName: string) {
    this.currentTest = {
      name: `${category} - ${testName}`,
      startTime: Date.now(),
    };
    console.log(`\n▶ Testing: ${category} - ${testName}`);
  }

  logPass(category: string, testName: string, details?: any) {
    const duration = this.currentTest ? Date.now() - this.currentTest.startTime : 0;
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      category,
      testName,
      status: 'PASS',
      duration,
      details,
    };
    this.results.push(result);
    console.log(`✓ PASS: ${category} - ${testName} (${duration}ms)`);
    this.currentTest = null;
  }

  logFail(category: string, testName: string, error: string, details?: any) {
    const duration = this.currentTest ? Date.now() - this.currentTest.startTime : 0;
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      category,
      testName,
      status: 'FAIL',
      duration,
      error,
      details,
    };
    this.results.push(result);
    console.log(`✗ FAIL: ${category} - ${testName} (${duration}ms)`);
    console.log(`  Error: ${error}`);
    this.currentTest = null;
  }

  logError(category: string, testName: string, error: Error | string, details?: any) {
    const duration = this.currentTest ? Date.now() - this.currentTest.startTime : 0;
    const errorMessage = error instanceof Error ? error.message : error;
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      category,
      testName,
      status: 'ERROR',
      duration,
      error: errorMessage,
      details: {
        ...details,
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
    this.results.push(result);
    console.log(`⚠ ERROR: ${category} - ${testName} (${duration}ms)`);
    console.log(`  Error: ${errorMessage}`);
    this.currentTest = null;
  }

  logSkip(category: string, testName: string, reason: string) {
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      category,
      testName,
      status: 'SKIP',
      error: reason,
    };
    this.results.push(result);
    console.log(`⊘ SKIP: ${category} - ${testName} - ${reason}`);
    this.currentTest = null;
  }

  getSummary(): TestSummary {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      totalTests: this.results.length,
      passed,
      failed,
      errors,
      skipped,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    };
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save detailed results
    const detailedPath = path.join(this.logDir, `test-results-${timestamp}.json`);
    fs.writeFileSync(detailedPath, JSON.stringify(this.results, null, 2));
    
    // Save summary
    const summary = this.getSummary();
    const summaryPath = path.join(this.logDir, `test-summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Save failures and errors only
    const issues = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (issues.length > 0) {
      const issuesPath = path.join(this.logDir, `test-issues-${timestamp}.json`);
      fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2));
    }
    
    // Save readable report
    this.saveReadableReport(timestamp);
    
    console.log(`\n📊 Test results saved to ${this.logDir}`);
    console.log(`   - Detailed results: test-results-${timestamp}.json`);
    console.log(`   - Summary: test-summary-${timestamp}.json`);
    if (issues.length > 0) {
      console.log(`   - Issues only: test-issues-${timestamp}.json`);
    }
    console.log(`   - Readable report: test-report-${timestamp}.txt`);
  }

  private saveReadableReport(timestamp: string) {
    const summary = this.getSummary();
    const reportPath = path.join(this.logDir, `test-report-${timestamp}.txt`);
    
    let report = '='.repeat(80) + '\n';
    report += 'TEMPLE PLATFORM - COMPREHENSIVE TEST REPORT\n';
    report += '='.repeat(80) + '\n\n';
    
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Duration: ${(summary.duration / 1000).toFixed(2)}s\n\n`;
    
    report += 'SUMMARY\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Tests: ${summary.totalTests}\n`;
    report += `✓ Passed:    ${summary.passed}\n`;
    report += `✗ Failed:    ${summary.failed}\n`;
    report += `⚠ Errors:    ${summary.errors}\n`;
    report += `⊘ Skipped:   ${summary.skipped}\n\n`;
    
    // Group by category
    const categorySet = new Set(this.results.map(r => r.category));
    const categories = Array.from(categorySet);
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      report += `\n${category.toUpperCase()}\n`;
      report += '-'.repeat(80) + '\n';
      
      for (const result of categoryResults) {
        const icon = result.status === 'PASS' ? '✓' : 
                     result.status === 'FAIL' ? '✗' : 
                     result.status === 'ERROR' ? '⚠' : '⊘';
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        report += `${icon} ${result.status}: ${result.testName}${duration}\n`;
        
        if (result.error) {
          report += `  Error: ${result.error}\n`;
        }
        
        if (result.details && Object.keys(result.details).length > 0) {
          report += `  Details: ${JSON.stringify(result.details, null, 2)}\n`;
        }
      }
    }
    
    // List all failures and errors at the end
    const issues = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (issues.length > 0) {
      report += '\n\n' + '='.repeat(80) + '\n';
      report += 'ISSUES THAT NEED FIXING\n';
      report += '='.repeat(80) + '\n\n';
      
      issues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.status}] ${issue.category} - ${issue.testName}\n`;
        report += `   ${issue.error}\n`;
        if (issue.details) {
          report += `   Details: ${JSON.stringify(issue.details, null, 2)}\n`;
        }
        report += '\n';
      });
    }
    
    report += '\n' + '='.repeat(80) + '\n';
    report += 'END OF REPORT\n';
    report += '='.repeat(80) + '\n';
    
    fs.writeFileSync(reportPath, report);
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`✓ Passed:    ${summary.passed}`);
    console.log(`✗ Failed:    ${summary.failed}`);
    console.log(`⚠ Errors:    ${summary.errors}`);
    console.log(`⊘ Skipped:   ${summary.skipped}`);
    console.log(`Duration:    ${(summary.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60) + '\n');
  }
}
