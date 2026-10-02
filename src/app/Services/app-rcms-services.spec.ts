import { TestBed } from '@angular/core/testing';

import { AppRcmsServices } from './app-rcms-services';

describe('AppRcmsServices', () => {
  let service: AppRcmsServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppRcmsServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
