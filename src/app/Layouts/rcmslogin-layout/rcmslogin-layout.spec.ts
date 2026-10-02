import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RCMSLoginLayout } from './rcmslogin-layout';

describe('RCMSLoginLayout', () => {
  let component: RCMSLoginLayout;
  let fixture: ComponentFixture<RCMSLoginLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RCMSLoginLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RCMSLoginLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
