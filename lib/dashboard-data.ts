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

export interface TreeNode {
    name: string
    children?: TreeNode[]
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

export const KNOWLEDGE_TREE: TreeNode = {
    name: 'TensorThrottleX',
    children: [
        {
            name: 'Why',
            children: [
                { name: 'Curiosity' },
                { name: 'Exploration' },
                { name: 'Challenge' },
                { name: 'Discovery' },
            ],
        },
        {
            name: 'Purpose',
            children: [
                { name: 'Build Value' },
                { name: 'Solve Problems' },
                { name: 'Share Knowledge' },
                { name: 'Inspire Others' },
            ],
        },
        {
            name: 'Principles',
            children: [
                { name: 'First Principles' },
                { name: 'Simplicity' },
                { name: 'Precision' },
                { name: 'Consistency' },
            ],
        },
        {
            name: 'Way',
            children: [
                { name: 'Think Deeply' },
                { name: 'Design Carefully' },
                { name: 'Build Deliberately' },
                { name: 'Refine Continuously' },
            ],
        },
        {
            name: 'Craft',
            children: [
                { name: 'Attention to Detail' },
                { name: 'Elegance' },
                { name: 'Performance' },
                { name: 'Quality' },
            ],
        },
        {
            name: 'Systems',
            children: [
                { name: 'Reliability' },
                { name: 'Scalability' },
                { name: 'Automation' },
                { name: 'Intelligence' },
            ],
        },
        {
            name: 'Evolution',
            children: [
                { name: 'Experiment' },
                { name: 'Iterate' },
                { name: 'Improve' },
                { name: 'Adapt' },
            ],
        },
        {
            name: 'Legacy',
            children: [
                { name: 'Open Knowledge' },
                { name: 'Better Systems' },
                { name: 'Lasting Impact' },
                { name: 'Future Builders' },
            ],
        },
    ],
}

export const FOUNDATION_ABOUT: CardContent = {
    label: 'ABOUT',
    heading: 'WHY THIS PLACE EXISTS',
    intro: 'This project started as a place to put things I was afraid to share. Code that wasn\'t finished. Ideas that didn\'t have a home. Over time, it became the most honest version of my work.',
    subCards: [
        { id: 'why-built', title: 'WHY I BUILT THIS', frontText: 'This project started as a place to put things I was afraid to share. Code that wasn\'t finished. Ideas that didn\'t have a home. Over time, it became the most honest version of my work.', contextLabel: 'Origin', contextText: 'I needed somewhere to keep the things that didn\'t fit anywhere else. No portfolio pressure, no polish required. Just a space where unfinished work was welcome.', detailsLabel: 'Why This Exists', details: ['A home for unfinished thoughts', 'Freedom from polish', 'Permission to share early', 'Honesty over presentation'], footerLabel: 'Truth', footerText: 'I built this for myself first.' },
        { id: 'means', title: 'WHAT IT MEANS TO ME', frontText: 'I learn by building things that might fail. Every experiment here taught me something no tutorial ever could. This space is my way of keeping that process visible.', contextLabel: 'Learning', contextText: 'Tutorials teach you what someone else already knows. Building teaches you what you didn\'t even know you needed to learn. Every failure here is a lesson I couldn\'t have gotten any other way.', detailsLabel: 'What I\'ve Learned', details: ['Failure teaches more than success', 'Questions matter more than answers', 'Visibility creates accountability', 'Process over outcome'], footerLabel: 'Belief', footerText: 'Building is how I think.' },
        { id: 'way', title: 'THE WAY I WORK', frontText: 'I don\'t plan much. I start with a question and follow where it leads. Some paths end quickly. Others turn into projects that grow for months. Both are valuable.', contextLabel: 'Process', contextText: 'My process is simple: find something interesting, start building, see what happens. I don\'t overthink the architecture upfront. I learn by doing, and I let the structure emerge naturally.', detailsLabel: 'How I Build', details: ['Start with a question, not a plan', 'Build first, understand later', 'Let structure emerge naturally', 'Value exploration over efficiency'], footerLabel: 'Practice', footerText: 'The question is the compass.' },
        { id: 'direction', title: 'WHERE IT\'S GOING', frontText: 'There\'s no final destination. The goal is to keep asking better questions, building uglier prototypes, and sharing more of the process. The work itself is the point.', contextLabel: 'Direction', contextText: 'I\'m not trying to build a finished product. I\'m trying to build a practice of showing up, staying curious, and sharing what I find along the way. If something useful comes out of it, that\'s a bonus.', detailsLabel: 'What\'s Next', details: ['Keep asking better questions', 'Share more of the process', 'Build things that scare me', 'Let the work lead the way'], footerLabel: 'Cycle', footerText: 'The work itself is the point.' }
    ],
    treeData: {
        name: "TensorThrottleX Foundation",
        children: [
            { name: "Why", children: [{ name: "Curiosity" }, { name: "Exploration" }, { name: "Discovery" }] },
            { name: "Purpose", children: [{ name: "Build Value" }, { name: "Solve Problems" }, { name: "Share Knowledge" }] },
            { name: "Craft", children: [{ name: "Attention to Detail" }, { name: "Elegance" }, { name: "Quality" }] },
            { name: "Legacy", children: [{ name: "Open Knowledge" }, { name: "Better Systems" }, { name: "Future Builders" }] }
        ]
    }
}

export const DASHBOARD_CONTENT: Record<'purpose' | 'about' | 'quote', CardContent> = {
    purpose: {
        label: 'FOUNDATION',
        heading: 'UNFINISHED BY DESIGN',
        intro: 'This space is for ideas, experiments, and unfinished thoughts that never made it into the real world, but shaped the way I think, build, and keep exploring.',
        subCards: [
            { id: 'curiosity', title: 'WHY THIS EXISTS', frontText: 'This space is for ideas, experiments, and unfinished thoughts that never made it into the real world, but shaped the way I think, build, and keep exploring.', contextLabel: 'Root', contextText: 'Curiosity is the only prerequisite. I do not need a plan or a deadline — just something that pulls me in. The best work happens when I follow the question instead of forcing the answer.', detailsLabel: 'What Drives It', details: ['Questions without answers', 'Late-night rabbit holes', 'Patterns that refuse to disappear', 'Ideas that scare me a little'], footerLabel: 'Truth', footerText: 'I build because I cannot stop wondering.' },
            { id: 'experiments', title: 'WHERE IT BEGINS', frontText: 'Most things here started as a simple thought. Some became projects. Others are still waiting for their moment.', contextLabel: 'Method', contextText: 'I give myself permission to fail loudly. Every broken prototype teaches more than a finished product ever could. The lab is where I learn what I actually think about a problem.', detailsLabel: 'How It Works', details: ['Build fast, learn faster', 'No hypothesis is wasted', 'Failure is data, not debt', 'Iteration over intention'], footerLabel: 'Practice', footerText: 'The experiment is the outcome.' },
            { id: 'unfinished', title: 'WHAT STAYS', frontText: 'I don\'t hide the unfinished parts. They\'re a reminder of where I started and how far each idea has come.', contextLabel: 'Value', contextText: 'Half-finished work is honest work. It shows the seams, the wrong turns, the moments I chose to stop and move on. I keep them here because they are more real than anything polished.', detailsLabel: 'What Stays', details: ['Partial architectures', 'Dead-end branches', 'Notes to future me', 'Proof I tried'], footerLabel: 'Belief', footerText: 'Incomplete is not the same as failed.' },
            { id: 'iteration', title: 'WHAT\'S NEXT', frontText: 'Nothing here is ever truly finished. Every project leaves behind another idea worth chasing.', contextLabel: 'Pattern', contextText: 'I return to old work and see new things. The cycle of building, stepping away, and coming back is how I actually learn. Each pass removes what does not matter and sharpens what does.', detailsLabel: 'The Loop', details: ['Build, break, revisit', 'Let time do the editing', 'Patterns emerge slowly', 'Clarity is earned, not given'], footerLabel: 'Cycle', footerText: 'Every version is a draft of the next one.' }
        ],
        treeData: {
            name: "TensorThrottleX",
            children: [
                { name: "Why", children: [{ name: "Curiosity" }, { name: "Exploration" }, { name: "Challenge" }, { name: "Discovery" }] },
                { name: "Purpose", children: [{ name: "Build Value" }, { name: "Solve Problems" }, { name: "Share Knowledge" }, { name: "Inspire Others" }] },
                { name: "Principles", children: [{ name: "First Principles" }, { name: "Simplicity" }, { name: "Precision" }, { name: "Consistency" }] },
                { name: "Way", children: [{ name: "Think Deeply" }, { name: "Design Carefully" }, { name: "Build Deliberately" }, { name: "Refine Continuously" }] },
                { name: "Craft", children: [{ name: "Attention to Detail" }, { name: "Elegance" }, { name: "Performance" }, { name: "Quality" }] },
                { name: "Systems", children: [{ name: "Reliability" }, { name: "Scalability" }, { name: "Automation" }, { name: "Intelligence" }] },
                { name: "Evolution", children: [{ name: "Experiment" }, { name: "Iterate" }, { name: "Improve" }, { name: "Adapt" }] },
                { name: "Legacy", children: [{ name: "Open Knowledge" }, { name: "Better Systems" }, { name: "Lasting Impact" }, { name: "Future Builders" }] }
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
                { name: "Why", children: [{ name: "Curiosity" }, { name: "Exploration" }, { name: "Discovery" }] },
                { name: "Purpose", children: [{ name: "Build Value" }, { name: "Solve Problems" }, { name: "Share Knowledge" }] },
                { name: "Craft", children: [{ name: "Attention to Detail" }, { name: "Elegance" }, { name: "Quality" }] },
                { name: "Legacy", children: [{ name: "Open Knowledge" }, { name: "Better Systems" }, { name: "Future Builders" }] }
            ]
        }
    },
    quote: {
        label: 'QUOTE',
        heading: 'SYSTEM MEMORY',
        intro: '“Those who cannot acknowledge themselves will eventually fail. We suffer more often in imagination than in reality.”',
        subCards: [
            {
                id: 'stoic',
                title: 'STOIC PROTOCOL',
                frontText: '“We suffer more often in imagination than in reality.” — Seneca. Focus on direct control and clear reasoning.',
                contextLabel: 'Focus',
                contextText: 'Stoic resilience, mental clarity, and execution discipline.',
                detailsLabel: 'Sources',
                details: ['Seneca', 'Marcus Aurelius', 'Epictetus'],
                footerLabel: 'Reference',
                footerText: 'Internal Alignment'
            },
            {
                id: 'growth',
                title: 'GROWTH AXIS',
                frontText: '“If you don\'t take risks, you can\'t create a future.” — Luffy. Action and audacity define system breakthroughs.',
                contextLabel: 'Focus',
                contextText: 'Engineering courage, bold exploration, and iterative risk.',
                detailsLabel: 'Sources',
                details: ['Monkey D. Luffy', 'Steve Jobs', 'Son Goku'],
                footerLabel: 'Reference',
                footerText: 'Audacious Execution'
            }
        ],
        treeData: {
            name: "Philosophical Foundation",
            children: [
                { name: "Wisdom", children: [{ name: "Self-Awareness" }, { name: "Resilience" }] },
                { name: "Growth", children: [{ name: "Curiosity" }, { name: "Persistence" }] }
            ]
        }
    }
}
