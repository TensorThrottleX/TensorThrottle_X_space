/**
 * DASHBOARD_CORE_DATA
 * Centralized data for both Desktop and Mobile dashboards.
 */

export interface SubCardContent {
    id: string
    title: string
    frontText: string
    contextLabel: string
    contextText: string
    detailsLabel: string
    details: string[]
    footerLabel: string
    footerText: string
}

export interface CardContent {
    label: string
    heading: string
    intro: string
    subCards: SubCardContent[]
    treeData: any
}

export interface QuoteData {
    text: string
    author?: string
}

export const SYSTEM_QUOTES: QuoteData[] = [
    { text: "Those who cannot acknowledge themselves will eventually fail.", author: "Itachi Uchiha" },
    { text: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy" },
    { text: "Power comes in response to a need, you have to create that need", author: "Son Goku" },
    { text: "Push through the pain. Giving up hurts more.", author: "Vegeta" },
    { text: "No matter how deep the night, it always turns to day.", author: "Brook" },
    { text: "The world isn't perfect. But it's there for us, trying the best it can.", author: "Roy Mustang" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" }
]

export const DASHBOARD_CONTENT: Record<'purpose' | 'about', CardContent> = {
    purpose: {
        label: 'PURPOSE',
        heading: 'SYSTEM MOTIVE',
        intro: 'Operational reasoning behind this platform — its design philosophy, and long-term execution trajectory.',
        subCards: [
            { id: 'intent', title: 'INTENT PROTOCOL', frontText: 'Every idea starts unshaped. This space helps to slow down and mould it clearly.', contextLabel: 'Action', contextText: "Clarify what I'm building. Set direction before I move.", detailsLabel: 'What Is Shown', details: ['Architectural intent', 'Decision logic', 'Trade-offs', 'Iterations'], footerLabel: 'Principle', footerText: 'Ground first. Build next.' },
            { id: 'motion', title: 'DESIGN IN MOTION', frontText: 'Ideas don’t stay abstract here. They begin to take structure.', contextLabel: 'Action', contextText: 'Sketch the system. Arrange components. Test how parts connect.', detailsLabel: 'What You Will See', details: ['Draft architectures', 'Experimental flows', 'Refactoring decisions', 'Incomplete frameworks'], footerLabel: 'Principle', footerText: 'Thoughts start forming into something real.' },
            { id: 'systems', title: 'HALF-BUILT SYSTEMS', frontText: 'Structured exposure of unfinished but intentional constructs.', contextLabel: 'Why Incomplete Matters', contextText: 'Half-built systems reveal real reasoning.', detailsLabel: 'Displayed', details: ['Early blueprints', 'Prototype states', 'Failed branches', 'Versioned attempts'], footerLabel: 'Principle', footerText: 'Clarity > perfection.' },
            { id: 'execution', title: 'EXECUTION TRACE', frontText: 'Nothing stays vague. Each step is visible and trackable.', contextLabel: 'Action', contextText: 'See what changed. See what worked. Refine based on real feedback.', detailsLabel: 'Logged Items', details: ['Intent', 'Implementation', 'Adjustment', 'Stabilization'], footerLabel: 'Outcome', footerText: 'Experiments become shaped outcomes.' },
            { id: 'workflow', title: 'System Workflow Architecture', frontText: 'A structured overview of how intent, exploration, systems, and execution interconnect across the platform.', contextLabel: 'Flow', contextText: 'Demonstrates the logical interconnection between system motives and terminal execution.', detailsLabel: 'System Logic', details: ['Intent → Architecture', 'Motion → Evolution', 'Prototype → Reasoning', 'Trace → Outcome'], footerLabel: 'Operational', footerText: 'System Coherent.' }
        ],
        treeData: {
            name: "TensorThrottleX System Core",
            children: [
                { name: "Intent Protocol", children: [{ name: "Defines operational reasoning" }, { name: "Establishes architectural direction" }] },
                { name: "Design in Motion", children: [{ name: "Transforms abstraction into structure" }, { name: "Documents evolving system states" }] },
                { name: "Half-Built Systems", children: [{ name: "Exposes thinking before polish" }, { name: "Reveals iteration cycles" }] },
                { name: "Execution Trace", children: [{ name: "Tracks implementation decisions" }, { name: "Connects intent to outcome" }] }
            ]
        }
    },
    about: {
        label: 'ABOUT',
        heading: 'Data & Machine Learning Research',
        intro: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.',
        subCards: [
            { id: 'primary', title: 'Data & ML Research', frontText: 'Focused on Data Science, Machine Learning, and AI systems through structured experimentation and applied modeling.', contextLabel: 'Work', contextText: 'Building experimental frameworks and research-aligned pipelines that convert complex datasets into interpretable and scalable intelligence. Work revolves around iterative modeling, statistical reasoning, and architecture-driven system design.', detailsLabel: 'Core', details: ['Machine Learning Systems', 'Statistical Modeling', 'Data Engineering Pipelines', 'AI Architecture & Research'], footerLabel: 'Direction', footerText: 'Framework discovery.' },
            { id: 'explorer', title: 'Experimental Model Explorer', frontText: 'Designing and testing ML architectures through iterative experimentation, validation cycles, and performance benchmarking.', contextLabel: 'Research', contextText: 'Emphasis on hypothesis-driven development and measurable model refinement.', detailsLabel: 'Process', details: ['Validation Cycles', 'Performance Benchmarking', 'Hypothesis Testing', 'Iterative Refinement'], footerLabel: 'Motive', footerText: 'Refinement over adoption.' },
            { id: 'builder', title: 'Applied ML Systems Builder', frontText: 'Engineering end-to-end data pipelines — from preprocessing and feature engineering to deployment.', contextLabel: 'Engineering', contextText: 'Focused on reproducibility, scalability, and execution discipline.', detailsLabel: 'Technical Focus', details: ['Data Pipelines', 'Feature Engineering', 'Optimization', 'Execution Discipline'], footerLabel: 'Motive', footerText: 'Reproducible intelligence.' },
            { id: 'research', title: 'AI Research-Oriented Explorer', frontText: 'Exploring advanced AI domains including statistical modeling, deep learning, and LLM-integrated systems.', contextLabel: 'Vision', contextText: 'Committed to long-horizon research depth over short-term trend adoption.', detailsLabel: 'Domains', details: ['Deep Learning', 'Statistical Modeling', 'LLM Architectures', 'Core Research'], footerLabel: 'Position', footerText: 'Long-horizon depth.' }
        ],
        treeData: {
            name: "TensorThrottleX",
            children: [
                {
                    name: "Data Intelligence",
                    children: [
                        { name: "Statistical Modeling", children: [{ name: "Statistical Learning Enthusiast" }] },
                        { name: "Signal Extraction", children: [{ name: "Statistical Learning Enthusiast" }] },
                        { name: "Feature Engineering", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Data Pipelines", children: [{ name: "Infrastructure Curiosity" }] }
                    ]
                },
                {
                    name: "Machine Learning Systems",
                    children: [
                        { name: "Deep Learning", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Representation Learning", children: [{ name: "Applied Intelligence Aficionado" }] },
                        { name: "Optimization Strategies", children: [{ name: "ML Optimization Interest" }] },
                        { name: "LLM-Oriented Systems", children: [{ name: "LLM Systems Explorer" }] }
                    ]
                },
                {
                    name: "Research Orientation",
                    children: [
                        { name: "Hypothesis-Driven Development", children: [{ name: "Research Interest" }] },
                        { name: "Experimental Iteration", children: [{ name: "Active Exploration" }] },
                        { name: "Model Validation", children: [{ name: "Experimental Focus" }] },
                        { name: "Benchmarking Frameworks", children: [{ name: "Research Interest" }] }
                    ]
                },
                {
                    name: "System Philosophy",
                    children: [
                        { name: "Architecture Before Code", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Structured Complexity", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Framework Creation", children: [{ name: "Systems Architecture Aficionado" }] },
                        { name: "Long-Horizon Building", children: [{ name: "Systems Architecture Aficionado" }] }
                    ]
                }
            ]
        }
    }
}
