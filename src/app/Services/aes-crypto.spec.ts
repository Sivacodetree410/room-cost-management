import { TestBed } from '@angular/core/testing';

import { AesCrypto } from './aes-crypto';

describe('AesCrypto', () => {
  let service: AesCrypto;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AesCrypto);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
