use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, PartialEq, Eq)]
pub enum PlanError { Cycle(Vec<String>) }

pub fn plan(graph: &BTreeMap<String, Vec<String>>) -> Result<Vec<String>, PlanError> {
    let mut nodes = BTreeSet::new();
    for (node, deps) in graph { nodes.insert(node.clone()); for dep in deps { nodes.insert(dep.clone()); } }
    let mut state: BTreeMap<String, u8> = BTreeMap::new();
    let mut output = Vec::new();
    for root in nodes {
        if state.get(&root) == Some(&2) { continue; }
        let mut stack: Vec<(String, usize, Vec<String>)> = vec![(root.clone(), 0, sorted_deps(graph, &root))];
        let mut path: Vec<String> = vec![root.clone()];
        state.insert(root, 1);
        while let Some((node, index, deps)) = stack.last_mut() {
            if *index < deps.len() {
                let dep = deps[*index].clone(); *index += 1;
                match state.get(&dep).copied().unwrap_or(0) {
                    0 => { state.insert(dep.clone(), 1); path.push(dep.clone()); stack.push((dep.clone(), 0, sorted_deps(graph, &dep))); }
                    1 => { let start = path.iter().position(|item| item == &dep).unwrap_or(0); let mut cycle = path[start..].to_vec(); cycle.push(dep); return Err(PlanError::Cycle(cycle)); }
                    _ => {}
                }
            } else {
                let finished = node.clone(); stack.pop(); path.pop();
                if state.get(&finished) != Some(&2) { state.insert(finished.clone(), 2); output.push(finished); }
            }
        }
    }
    Ok(output)
}

fn sorted_deps(graph: &BTreeMap<String, Vec<String>>, node: &str) -> Vec<String> {
    let mut deps = graph.get(node).cloned().unwrap_or_default(); deps.sort(); deps.dedup(); deps
}

