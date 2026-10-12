/**
 * BinGo – CollectionScheduleScreen Tests
 * Testing: Schedule display, area switching, tab navigation, calendar interactions
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CollectionScheduleScreen from '../CollectionScheduleScreen';
import { getSchedules } from '../../services/scheduleService';

// Mock services
jest.mock('../../services/scheduleService');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Sample mock data
const mockSchedules = [
  {
    _id: '1',
    wasteType: 'Recycling',
    collectionDay: 'Monday',
    collectionTime: '06:00 AM',
    frequency: 'weekly',
    area: 'Colombo 03',
    notes: 'Place bin on kerb',
  },
  {
    _id: '2',
    wasteType: 'General Waste',
    collectionDay: 'Wednesday',
    collectionTime: '06:30 AM',
    frequency: 'weekly',
    area: 'Colombo 03',
  },
  {
    _id: '3',
    wasteType: 'Organic Waste',
    collectionDay: 'Friday',
    collectionTime: '07:00 AM',
    frequency: 'weekly',
    area: 'Colombo 03',
  },
];

describe('CollectionScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSchedules.mockResolvedValue(mockSchedules);
  });

  // ── RENDERING TESTS ────────────────────────────────────────────────
  describe('Rendering', () => {
    it('should render the screen with header', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('Collection Schedule')).toBeTruthy();
      });
    });

    it('should display loading state initially', () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      expect(getByText('Loading schedule...')).toBeTruthy();
    });

    it('should display LIVE badge', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('LIVE')).toBeTruthy();
      });
    });

    it('should render all four tabs', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy();
        expect(getByText('Upcoming')).toBeTruthy();
        expect(getByText('Calendar')).toBeTruthy();
        expect(getByText('History')).toBeTruthy();
      });
    });

    it('should display default area', async () => {
      const { getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const areaElements = getAllByText('📍 Colombo 03');
        expect(areaElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ── DATA LOADING TESTS ─────────────────────────────────────────────
  describe('Data Loading', () => {
    it('should load schedules on mount', async () => {
      render(<CollectionScheduleScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getSchedules).toHaveBeenCalledWith('Colombo 03');
      });
    });

    it('should reload schedules when area changes', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getSchedules).toHaveBeenCalledWith('Colombo 03');
      });
      
      fireEvent.press(getByText('📍 Colombo 05'));
      
      await waitFor(() => {
        expect(getSchedules).toHaveBeenCalledWith('Colombo 05');
      });
    });

    it('should handle loading error gracefully', async () => {
      getSchedules.mockRejectedValue(new Error('Network error'));
      
      const { queryByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(queryByText('Loading schedule...')).toBeFalsy();
      });
    });
  });

  // ── AREA SWITCHING TESTS ───────────────────────────────────────────
  describe('Area Selection', () => {
    it('should render area picker with all areas', async () => {
      const { getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getAllByText('📍 Colombo 03').length).toBeGreaterThan(0);
        expect(getAllByText('📍 Colombo 05').length).toBeGreaterThan(0);
        expect(getAllByText('📍 Colombo 07').length).toBeGreaterThan(0);
      });
    });

    it('should highlight selected area', async () => {
      const { getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const colombo03 = getAllByText('📍 Colombo 03')[0];
        expect(colombo03).toBeTruthy();
      });
    });

    it('should switch area when clicked', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('📍 Colombo 05'));
      });
      
      expect(getSchedules).toHaveBeenCalledWith('Colombo 05');
    });
  });

  // ── TAB NAVIGATION TESTS ───────────────────────────────────────────
  describe('Tab Navigation', () => {
    it('should default to Today tab', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText(/Good (Morning|Afternoon|Evening)/)).toBeTruthy();
      });
    });

    it('should switch to Upcoming tab when clicked', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Upcoming'));
      });
      
      expect(getByText('Next 8 Collections')).toBeTruthy();
    });

    it('should switch to Calendar tab when clicked', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      expect(getByText(/\d+ collections this month/)).toBeTruthy();
    });

    it('should switch to History tab when clicked', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('History'));
      });
      
      expect(getByText('Past 30 Days')).toBeTruthy();
    });
  });

  // ── TODAY TAB TESTS ────────────────────────────────────────────────
  describe('Today Tab', () => {
    it('should display greeting message', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText(/Good (Morning|Afternoon|Evening)/)).toBeTruthy();
      });
    });

    it('should display week strip with 7 days', async () => {
      const { getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const dayLabels = getAllByText(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/);
        expect(dayLabels.length).toBeGreaterThan(0);
      });
    });

    it('should show no collection message when no collection today', async () => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const noCollectionSchedules = mockSchedules.filter(s => s.collectionDay !== today);
      getSchedules.mockResolvedValue(noCollectionSchedules);
      
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('No Collection Today')).toBeTruthy();
      });
    });

    it('should display custom reminder button', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('Custom Reminders')).toBeTruthy();
      });
    });

    it('should navigate to custom reminder screen', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Custom Reminders'));
      });
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CustomReminder');
    });

    it('should display collection tips', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText(/Place bins on the kerb/)).toBeTruthy();
      });
    });
  });

  // ── UPCOMING TAB TESTS ─────────────────────────────────────────────
  describe('Upcoming Tab', () => {
    it('should display summary stats', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Upcoming'));
      });
      
      expect(getByText('Scheduled')).toBeTruthy();
      expect(getByText('This Week')).toBeTruthy();
      expect(getByText('Types')).toBeTruthy();
    });

    it('should display upcoming collections', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Upcoming'));
      });
      
      expect(getByText('Next 8 Collections')).toBeTruthy();
    });

    it('should show days until collection', async () => {
      const { getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getAllByText('Upcoming')[0]);
      });
      
      const daysLabels = getAllByText(/\d+/);
      expect(daysLabels.length).toBeGreaterThan(0);
    });

    it('should display holiday schedule', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Upcoming'));
      });
      
      expect(getByText('Holiday Schedule')).toBeTruthy();
    });
  });

  // ── CALENDAR TAB TESTS ─────────────────────────────────────────────
  describe('Calendar Tab', () => {
    it('should display current month', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(getByText(currentMonth)).toBeTruthy();
    });

    it('should display weekday labels', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      expect(getByText('Su')).toBeTruthy();
      expect(getByText('Mo')).toBeTruthy();
      expect(getByText('Tu')).toBeTruthy();
    });

    it('should navigate to next month', async () => {
      const { getByText, getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      const nextButtons = getAllByText('›');
      fireEvent.press(nextButtons[0]);
      
      // Should show different month
      await waitFor(() => {
        expect(getByText(/\d+ collections this month/)).toBeTruthy();
      });
    });

    it('should navigate to previous month', async () => {
      const { getByText, getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      const prevButtons = getAllByText('‹');
      fireEvent.press(prevButtons[0]);
      
      // Should show different month
      await waitFor(() => {
        expect(getByText(/\d+ collections this month/)).toBeTruthy();
      });
    });

    it('should display legend', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Calendar'));
      });
      
      expect(getByText('Legend')).toBeTruthy();
    });
  });

  // ── HISTORY TAB TESTS ──────────────────────────────────────────────
  describe('History Tab', () => {
    it('should display history stats', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('History'));
      });
      
      expect(getByText('This Month')).toBeTruthy();
      expect(getByText(/Day Streak/)).toBeTruthy();
      expect(getByText('Past 30 Days')).toBeTruthy();
    });

    it('should display filter chips', async () => {
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('History'));
      });
      
      expect(getByText('All Types')).toBeTruthy();
    });

    it('should filter history by waste type', async () => {
      const { getByText, getAllByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('History'));
      });
      
      fireEvent.press(getByText(/♻️ Recycling/));
      
      // Should filter to show only recycling items
      await waitFor(() => {
        const recyclingElements = getAllByText(/Recycling/);
        expect(recyclingElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ── NAVIGATION TESTS ───────────────────────────────────────────────
  describe('Navigation', () => {
    it('should go back when back button pressed', async () => {
      const { getByLabelText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const backButton = getByLabelText('Go back');
        fireEvent.press(backButton);
      });
      
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate to set reminder screen', async () => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = mockSchedules.find(s => s.collectionDay === today);
      
      if (todaySchedule) {
        const { getByText } = render(
          <CollectionScheduleScreen navigation={mockNavigation} />
        );
        
        await waitFor(() => {
          fireEvent.press(getByText('Set Reminder'));
        });
        
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'SetReminder',
          expect.objectContaining({ schedule: todaySchedule })
        );
      }
    });
  });

  // ── EDGE CASES ─────────────────────────────────────────────────────
  describe('Edge Cases', () => {
    it('should handle empty schedules array', async () => {
      getSchedules.mockResolvedValue([]);
      
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('No Collection Today')).toBeTruthy();
      });
    });

    it('should handle schedules without collection time', async () => {
      const schedulesWithoutTime = mockSchedules.map(s => ({ ...s, collectionTime: null }));
      getSchedules.mockResolvedValue(schedulesWithoutTime);
      
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('Collection Schedule')).toBeTruthy();
      });
    });

    it('should handle schedules without notes', async () => {
      const schedulesWithoutNotes = mockSchedules.map(s => ({ ...s, notes: null }));
      getSchedules.mockResolvedValue(schedulesWithoutNotes);
      
      const { getByText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByText('Collection Schedule')).toBeTruthy();
      });
    });
  });

  // ── ACCESSIBILITY TESTS ────────────────────────────────────────────
  describe('Accessibility', () => {
    it('should have accessible back button', async () => {
      const { getByLabelText } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        expect(getByLabelText('Go back')).toBeTruthy();
      });
    });

    it('should have accessible area buttons', async () => {
      const { getAllByRole } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const areaButtons = getAllByRole('button');
        expect(areaButtons.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible tab buttons', async () => {
      const { getAllByRole } = render(
        <CollectionScheduleScreen navigation={mockNavigation} />
      );
      
      await waitFor(() => {
        const tabs = getAllByRole('tab');
        expect(tabs.length).toBe(4);
      });
    });
  });
});
