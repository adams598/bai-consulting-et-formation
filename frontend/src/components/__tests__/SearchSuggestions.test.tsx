import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchSuggestions from '../SearchSuggestions';
import { Formation, Universe } from '../../features/admin/types';

// Mock des données de test
const mockFormations: Formation[] = [
  {
    id: '1',
    title: 'Formation Test 1',
    description: 'Description de la formation test 1',
    duration: 60,
    isActive: true,
    hasQuiz: false,
    quizRequired: false,
    createdBy: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    universeId: 'universe-1',
    isOpportunity: false
  },
  {
    id: '2',
    title: 'Formation Test 2',
    description: 'Description de la formation test 2',
    duration: 90,
    isActive: true,
    hasQuiz: true,
    quizRequired: false,
    createdBy: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    universeId: 'universe-2',
    isOpportunity: true
  }
];

const mockUniverses: Universe[] = [
  {
    id: 'universe-1',
    name: 'Univers Test 1',
    description: 'Description univers test 1',
    color: '#FF0000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'universe-2',
    name: 'Univers Test 2',
    description: 'Description univers test 2',
    color: '#00FF00',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('SearchSuggestions', () => {
  const mockOnSuggestionClick = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ne s\'affiche pas quand isVisible est false', () => {
    render(
      <SearchSuggestions
        searchTerm="test"
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={false}
      />
    );

    expect(screen.queryByText('Formation Test 1')).not.toBeInTheDocument();
  });

  it('ne s\'affiche pas quand searchTerm est vide', () => {
    render(
      <SearchSuggestions
        searchTerm=""
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    expect(screen.queryByText('Formation Test 1')).not.toBeInTheDocument();
  });

  it('affiche les suggestions quand searchTerm correspond', () => {
    render(
      <SearchSuggestions
        searchTerm="test"
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    expect(screen.getByText('Formation Test 1')).toBeInTheDocument();
    expect(screen.getByText('Formation Test 2')).toBeInTheDocument();
    expect(screen.getByText('Univers Test 1')).toBeInTheDocument();
    expect(screen.getByText('Univers Test 2')).toBeInTheDocument();
  });

  it('affiche le format [univers]/[formation] pour les formations', () => {
    render(
      <SearchSuggestions
        searchTerm="test"
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    expect(screen.getByText('Univers Test 1/Formation Test 1')).toBeInTheDocument();
    expect(screen.getByText('Opportunités commerciales/Formation Test 2')).toBeInTheDocument();
  });

  it('appelle onSuggestionClick quand on clique sur une formation', () => {
    render(
      <SearchSuggestions
        searchTerm="test"
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    fireEvent.click(screen.getByText('Formation Test 1'));
    expect(mockOnSuggestionClick).toHaveBeenCalledWith(mockFormations[0]);
  });

  it('met en évidence le terme de recherche', () => {
    render(
      <SearchSuggestions
        searchTerm="Test"
        formations={mockFormations}
        universes={mockUniverses}
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    const highlightedElements = screen.getAllByText('Test');
    expect(highlightedElements.length).toBeGreaterThan(0);
  });
});


