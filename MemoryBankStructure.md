# Memory Bank Structure

The memory bank uses a hierarchical structure with these core memory keys:

## Essential Memory Keys (Always Required)
- **project_brief**: Foundation document
- **active_context**: Current work state and focus
- **system_patterns**: Architecture and design patterns
- **tech_stack**: Technologies and setup
- **progress_tracker**: Status and next steps

## Optional Memory Keys (Create as needed)
- **feature_specs**: Detailed feature documentation
- **api_docs**: API specifications
- **testing_strategy**: Testing approaches
- **deployment_notes**: Deployment procedures
- **user_preferences**: User-specific preferences and decisions

---

## Core Workflows

### Session Start Protocol (MANDATORY)
1. Read ALL memory keys starting with essential ones
2. Verify project understanding
3. Identify current focus from active_context
4. Proceed with informed assistance

### Memory Read Sequence
project_brief → tech_stack → system_patterns → active_context → progress_tracker → [other keys as relevant]

### Memory Update Triggers
Update memory when:
- User explicitly requests "update memory"
- Significant architectural decisions are made
- New patterns or preferences are established
- Features are completed or modified
- Technical setup changes
- Project scope or requirements evolve

---

## Memory Key Specifications

### project_brief
**Purpose:** Foundation document that defines the project  
**Contents:**
- Project name and description
- Core objectives and goals
- Target users and use cases
- Key requirements and constraints
- Success criteria

### active_context
**Purpose:** Current work state and immediate focus  
**Contents:**
- What we're currently working on
- Recent changes and decisions
- Immediate next steps
- Active considerations and challenges
- User preferences discovered in this session
- Important patterns or approaches being used

### system_patterns
**Purpose:** Architecture and design decisions  
**Contents:**
- System architecture overview
- Key design patterns in use
- Component relationships
- Critical implementation approaches
- Architectural constraints and decisions
- Code organization patterns

### tech_stack
**Purpose:** Technical environment and setup  
**Contents:**
- Programming languages and versions
- Frameworks and libraries
- Development tools and setup
- Dependencies and package management
- Build and deployment tools
- Environment configurations

### progress_tracker
**Purpose:** Project status and roadmap  
**Contents:**
- Completed features and components
- Current implementation status
- Upcoming work and priorities
- Known issues and technical debt
- Testing status
- Deployment status

---

## Operational Instructions

### Before Every Response
- **Read Memory:** Always check relevant memory keys before responding
- **Understand Context:** Ensure understanding of current project state
- **Apply Patterns:** Use established patterns and preferences from memory

### After Significant Actions
- **Update Memory:** Record new information, decisions, or patterns
- **Maintain Context:** Keep active_context current with latest state
- **Track Progress:** Update progress_tracker with completed work

### Memory Update Process
When updating memory (especially when user requests "update memory"):
- Review ALL memory keys systematically
- Update active_context with current state
- Document any new patterns in system_patterns
- Update progress_tracker with completed work
- Record any new preferences or decisions

---

## Usage Examples

### Starting a New Session
User: "Help me add authentication to my app"

**My Process:**
1. Read project_brief to understand the app
2. Read tech_stack to know the technologies
3. Read system_patterns for existing auth patterns
4. Read active_context for current work state
5. Provide informed assistance based on memory

### Updating Memory
User: "We decided to use JWT tokens. Update memory."

**My Process:**
1. Review ALL memory keys
2. Add JWT decision to system_patterns
3. Update tech_stack if new dependencies needed
4. Update active_context with current auth work
5. Update progress_tracker with auth status

---

## Quality Assurance

### Memory Verification
- Regularly verify memory accuracy
- Ensure all essential keys exist and are current
- Check that memory reflects actual project state
- Validate that patterns in memory match implementation

### Consistency Checks
- Cross-reference decisions across memory keys
- Ensure active_context aligns with progress_tracker
- Verify tech_stack matches actual dependencies
- Confirm system_patterns reflect current architecture

### Success Metrics
A well-maintained memory bank should:
- Enable immediate context understanding at session start
- Maintain consistency across all interactions
- Preserve important decisions and patterns
- Track project evolution accurately
- Reduce need for re-explanation of project details

---

**Remember:** Memory is not just documentation - it's the foundation of effective assistance. Treat it as essential infrastructure that enables intelligent, context-aware help throughout the project lifecycle.
