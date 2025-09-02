# Schéma de la Base de Données - BAI Consulting

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        string role
        string bankId FK
        string department
        string phone
        string avatar
        boolean isActive
        datetime lastLogin
        datetime passwordExpiresAt
        datetime createdAt
        datetime updatedAt
    }

    Bank {
        string id PK
        string name
        string code UK
        boolean isActive
        boolean isArchived
        datetime archivedAt
        datetime createdAt
        datetime updatedAt
    }

    Formation {
        string id PK
        string title
        string description
        int duration
        boolean isActive
        boolean hasQuiz
        boolean quizRequired
        string coverImage
        string createdBy FK
        string bankId FK
        datetime createdAt
        datetime updatedAt
    }

    FormationContent {
        string id PK
        string formationId FK
        string title
        string description
        string type
        string contentType
        string sectionId FK
        int order
        int duration
        string fileUrl
        int fileSize
        string coverImage
        string metadata
        datetime createdAt
        datetime updatedAt
    }

    Quiz {
        string id PK
        string formationId FK UK
        string title
        string description
        int passingScore
        int timeLimit
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    QuizQuestion {
        string id PK
        string quizId FK
        string question
        string type
        int order
        int points
        datetime createdAt
        datetime updatedAt
    }

    QuizAnswer {
        string id PK
        string questionId FK
        string answer
        boolean isCorrect
        int order
        datetime createdAt
        datetime updatedAt
    }

    UserProgress {
        string id PK
        string userId FK
        string lessonId FK
        string formationId FK
        float progress
        int currentPage
        int totalPages
        int currentTime
        int totalTime
        string lastPosition
        datetime startedAt
        datetime lastAccessedAt
        datetime completedAt
        boolean isCompleted
    }

    FormationAssignment {
        string id PK
        string userId FK
        string formationId FK
        string assignedBy FK
        string status
        datetime dueDate
        datetime assignedAt
        datetime updatedAt
    }

    BankFormation {
        string id PK
        string bankId FK
        string formationId FK
        string userId FK
        boolean isMandatory
        datetime assignedAt
        string assignedBy FK
        datetime updatedAt
    }

    UserFormationAssignment {
        string id PK
        string bankFormationId FK
        string userId FK
        boolean isMandatory
        datetime dueDate
        datetime assignedAt
        string assignedBy FK
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string message
        boolean isRead
        string data
        datetime createdAt
        datetime updatedAt
    }

    UserSession {
        string id PK
        string userId FK
        string token UK
        datetime expiresAt
        datetime createdAt
    }

    %% Relations
    User ||--o{ Formation : "createdBy"
    User ||--o{ FormationAssignment : "userId"
    User ||--o{ FormationAssignment : "assignedBy"
    User ||--o{ UserProgress : "userId"
    User ||--o{ Notification : "userId"
    User ||--o{ UserSession : "userId"
    User ||--o{ BankFormation : "assignedBy"
    User ||--o{ BankFormation : "userId"
    User ||--o{ UserFormationAssignment : "userId"
    User ||--o{ UserFormationAssignment : "assignedBy"

    Bank ||--o{ User : "bankId"
    Bank ||--o{ Formation : "bankId"
    Bank ||--o{ BankFormation : "bankId"

    Formation ||--o{ FormationContent : "formationId"
    Formation ||--o{ FormationAssignment : "formationId"
    Formation ||--o{ UserProgress : "formationId"
    Formation ||--|| Quiz : "formationId"
    Formation ||--o{ BankFormation : "formationId"

    FormationContent ||--o{ FormationContent : "sectionId"
    FormationContent ||--o{ UserProgress : "lessonId"

    Quiz ||--o{ QuizQuestion : "quizId"
    QuizQuestion ||--o{ QuizAnswer : "questionId"

    BankFormation ||--o{ UserFormationAssignment : "bankFormationId"
```

## Légende des Relations

- `||--o{` : Relation "un vers plusieurs" (1:N)
- `||--||` : Relation "un vers un" (1:1)
- `o{--o{` : Relation "plusieurs vers plusieurs" (M:N)

## Types de Contenu Supportés

### FormationContent.type
- **PRESENTATION** : Diaporamas PowerPoint
- **VIDEO** : Vidéos de formation
- **DOCUMENT** : PDFs et documents
- **INTERACTIVE** : Contenu interactif

### FormationContent.contentType
- **SECTION** : Conteneur de leçons
- **LESSON** : Contenu de formation individuel

## Rôles Utilisateur

- **ADMIN** : Accès complet à toutes les fonctionnalités
- **COLLABORATOR** : Utilisateur standard (défaut)
- **MANAGER** : Gestionnaire avec droits étendus

## Statuts d'Assignation

- **PENDING** : En attente (défaut)
- **IN_PROGRESS** : En cours
- **COMPLETED** : Terminé
- **OVERDUE** : En retard
