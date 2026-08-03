# Event Architecture

The media platform minimizes global event buses. Communication is primarily unidirectional via React Context and Hooks. The Universal Prism interacts with the page via `onActiveChange(id)`, which then updates the Orchestrator's session.
