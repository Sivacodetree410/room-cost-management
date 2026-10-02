import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RcmspreloginLayout } from './rcmsprelogin-layout';

describe('RcmspreloginLayout', () => {
  let component: RcmspreloginLayout;
  let fixture: ComponentFixture<RcmspreloginLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RcmspreloginLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RcmspreloginLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
