use anchor_lang::prelude::*;
use std::collections::HashMap;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BioscienceDataFeed {
    pub feed_id: String,
    pub data_provider: DataProvider,
    pub api_endpoint: String,
    pub auth_method: AuthMethod,
    pub update_frequency: u32, // seconds between updates
    pub last_update: i64,
    pub is_active: bool,
    pub reliability_score: f64, // 0.0 to 1.0
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum DataProvider {
    ClinicalTrialsGov,
    FDA,
    EMA,            // European Medicines Agency
    NIH,            // National Institutes of Health
    WHO,            // World Health Organization
    USPTO,          // US Patent and Trademark Office
    PubMed,
    ClinicalData,   // Commercial clinical data provider
    Custom(String),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum AuthMethod {
    ApiKey(String),
    OAuth2Token(String),
    BasicAuth { username: String, password_hash: [u8; 32] },
    PublicAccess,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ClinicalTrialData {
    pub nct_id: String,                    // ClinicalTrials.gov identifier
    pub trial_title: String,
    pub sponsor: String,
    pub phase: ClinicalPhase,
    pub status: super::TrialStatus,
    pub primary_endpoint: String,
    pub enrollment_target: u32,
    pub enrollment_actual: u32,
    pub start_date: i64,
    pub completion_date: Option<i64>,
    pub primary_outcome: Option<OutcomeData>,
    pub secondary_outcomes: Vec<OutcomeData>,
    pub adverse_events: Vec<AdverseEvent>,
    pub interim_analyses: Vec<InterimAnalysis>,
    pub data_monitoring_committee: bool,
    pub early_termination_rules: Vec<TerminationRule>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ClinicalPhase {
    Preclinical,
    PhaseI,
    PhaseII,
    PhaseIII,
    PhaseIV,
    NotApplicable,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct OutcomeData {
    pub measure: String,
    pub description: String,
    pub time_frame: String,
    pub population: String,
    pub result_value: Option<f64>,
    pub confidence_interval_low: Option<f64>,
    pub confidence_interval_high: Option<f64>,
    pub p_value: Option<f64>,
    pub statistical_method: Option<String>,
    pub meets_primary_endpoint: Option<bool>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AdverseEvent {
    pub event_term: String,
    pub severity: Severity,
    pub frequency: u32,
    pub total_participants: u32,
    pub causality_assessment: Causality,
    pub action_taken: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Severity {
    Mild,
    Moderate,
    Severe,
    LifeThreatening,
    Fatal,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Causality {
    NotRelated,
    Unlikely,
    Possible,
    Probable,
    Definite,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InterimAnalysis {
    pub analysis_date: i64,
    pub participants_analyzed: u32,
    pub efficacy_boundary_crossed: bool,
    pub futility_boundary_crossed: bool,
    pub safety_concerns: bool,
    pub recommendation: InterimRecommendation,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum InterimRecommendation {
    Continue,
    ModifyProtocol,
    EarlyTerminationEfficacy,
    EarlyTerminationFutility,
    EarlyTerminationSafety,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TerminationRule {
    pub rule_type: TerminationRuleType,
    pub threshold: f64,
    pub description: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TerminationRuleType {
    EfficacyBoundary,
    FutilityBoundary,
    SafetyBoundary,
    EnrollmentFailure,
    ExternalEvidence,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RegulatoryData {
    pub application_id: String,            // FDA submission ID, EMA number, etc.
    pub drug_name: String,
    pub indication: String,
    pub applicant: String,
    pub application_type: ApplicationType,
    pub submission_date: i64,
    pub review_status: super::RegulatoryStatus,
    pub priority_review: bool,
    pub breakthrough_designation: bool,
    pub fast_track_designation: bool,
    pub orphan_drug_designation: bool,
    pub review_timeline: ReviewTimeline,
    pub regulatory_milestones: Vec<RegulatoryMilestone>,
    pub deficiency_letters: Vec<DeficiencyLetter>,
    pub advisory_committee_meeting: Option<AdvisoryCommitteeData>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ApplicationType {
    NDA,    // New Drug Application
    BLA,    // Biologics License Application
    ANDA,   // Abbreviated New Drug Application
    IDE,    // Investigational Device Exemption
    PMA,    // Premarket Approval
    De510k, // 510(k) clearance
    EMA,    // European Medicines Agency
    Other(String),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ReviewTimeline {
    pub standard_review_date: i64,
    pub priority_review_date: Option<i64>,
    pub actual_action_date: Option<i64>,
    pub review_clock_days: u32,
    pub days_remaining: i32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RegulatoryMilestone {
    pub milestone_type: MilestoneType,
    pub date: i64,
    pub description: String,
    pub outcome: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MilestoneType {
    ApplicationSubmitted,
    ReviewStarted,
    DeficiencyLetterIssued,
    DeficiencyResponseReceived,
    AdvisoryCommitteeScheduled,
    AdvisoryCommitteeHeld,
    FinalReviewStarted,
    ActionLetterIssued,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DeficiencyLetter {
    pub issue_date: i64,
    pub response_due_date: i64,
    pub deficiency_count: u32,
    pub major_deficiencies: u32,
    pub minor_deficiencies: u32,
    pub responded: bool,
    pub response_date: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AdvisoryCommitteeData {
    pub meeting_date: i64,
    pub committee_name: String,
    pub voting_question: String,
    pub votes_yes: u32,
    pub votes_no: u32,
    pub abstentions: u32,
    pub recommendation: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct IntellectualPropertyData {
    pub patent_number: String,
    pub patent_title: String,
    pub inventor: String,
    pub assignee: String,
    pub filing_date: i64,
    pub publication_date: i64,
    pub grant_date: Option<i64>,
    pub expiration_date: i64,
    pub patent_status: PatentStatus,
    pub claim_count: u32,
    pub independent_claims: u32,
    pub patent_family_size: u32,
    pub citations_forward: u32,
    pub citations_backward: u32,
    pub litigation_history: Vec<LitigationEvent>,
    pub licensing_status: LicensingStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum PatentStatus {
    Pending,
    Granted,
    Abandoned,
    Expired,
    Invalidated,
    Reexamination,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LitigationEvent {
    pub case_number: String,
    pub court: String,
    pub filing_date: i64,
    pub plaintiff: String,
    pub defendant: String,
    pub case_status: LitigationStatus,
    pub outcome: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum LitigationStatus {
    Filed,
    Discovery,
    Trial,
    Appeal,
    Settled,
    Dismissed,
    Judgment,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum LicensingStatus {
    Available,
    Exclusively_Licensed,
    Non_Exclusively_Licensed,
    Not_Available,
    Under_Negotiation,
}

// Risk assessment functions
impl ClinicalTrialData {
    pub fn calculate_risk_score(&self) -> f64 {
        let mut risk_score = 0.0;

        // Phase risk (higher phases are less risky)
        risk_score += match self.phase {
            ClinicalPhase::Preclinical => 0.8,
            ClinicalPhase::PhaseI => 0.7,
            ClinicalPhase::PhaseII => 0.5,
            ClinicalPhase::PhaseIII => 0.3,
            ClinicalPhase::PhaseIV => 0.1,
            ClinicalPhase::NotApplicable => 0.4,
        };

        // Enrollment risk
        if self.enrollment_actual > 0 {
            let enrollment_ratio = self.enrollment_actual as f64 / self.enrollment_target as f64;
            if enrollment_ratio < 0.5 {
                risk_score += 0.3; // Poor enrollment
            } else if enrollment_ratio < 0.8 {
                risk_score += 0.1; // Moderate enrollment issues
            }
        }

        // Status risk
        risk_score += match self.status {
            super::TrialStatus::Planned => 0.2,
            super::TrialStatus::Recruiting => 0.15,
            super::TrialStatus::Active => 0.1,
            super::TrialStatus::Paused => 0.4,
            super::TrialStatus::Completed => 0.0,
            super::TrialStatus::Failed => 1.0,
            super::TrialStatus::Terminated => 1.0,
        };

        // Adverse events risk
        let severe_ae_rate = self.adverse_events.iter()
            .filter(|ae| matches!(ae.severity, Severity::Severe | Severity::LifeThreatening | Severity::Fatal))
            .count() as f64 / self.enrollment_actual.max(1) as f64;

        risk_score += severe_ae_rate * 0.5;

        risk_score.min(1.0)
    }

    pub fn get_efficacy_probability(&self) -> Option<f64> {
        if let Some(ref primary_outcome) = self.primary_outcome {
            if let Some(meets_endpoint) = primary_outcome.meets_primary_endpoint {
                return Some(if meets_endpoint { 0.9 } else { 0.1 });
            }

            // Use p-value to estimate probability
            if let Some(p_value) = primary_outcome.p_value {
                return Some((1.0 - p_value).max(0.0).min(1.0));
            }
        }

        None
    }
}

impl RegulatoryData {
    pub fn calculate_approval_probability(&self) -> f64 {
        let mut probability = 0.5; // Base probability

        // Application type affects probability
        probability += match self.application_type {
            ApplicationType::NDA => 0.1,
            ApplicationType::BLA => 0.15,
            ApplicationType::ANDA => 0.3, // Generics have higher approval rates
            ApplicationType::De510k => 0.2,
            _ => 0.0,
        };

        // Special designations increase probability
        if self.breakthrough_designation { probability += 0.2; }
        if self.fast_track_designation { probability += 0.1; }
        if self.orphan_drug_designation { probability += 0.15; }

        // Deficiency letters decrease probability
        let total_deficiencies: u32 = self.deficiency_letters.iter()
            .map(|dl| dl.deficiency_count)
            .sum();

        probability -= (total_deficiencies as f64) * 0.02;

        // Advisory committee recommendation
        if let Some(ref ac_data) = self.advisory_committee_meeting {
            let vote_ratio = ac_data.votes_yes as f64 /
                (ac_data.votes_yes + ac_data.votes_no) as f64;
            probability += (vote_ratio - 0.5) * 0.3;
        }

        probability.max(0.0).min(1.0)
    }
}

impl IntellectualPropertyData {
    pub fn calculate_invalidation_risk(&self) -> f64 {
        let mut risk = 0.0;

        // Patent age increases risk
        let current_time = Clock::get().unwrap().unix_timestamp;
        let patent_age_years = (current_time - self.filing_date) / (365 * 24 * 60 * 60);
        risk += (patent_age_years as f64 / 20.0) * 0.3; // Max 0.3 for 20-year-old patents

        // Litigation history increases risk
        let litigation_count = self.litigation_history.len() as f64;
        risk += (litigation_count / 10.0) * 0.2; // Max 0.2 for 10+ litigations

        // Claim count affects risk (more claims = more attack surface)
        risk += (self.claim_count as f64 / 50.0) * 0.1; // Max 0.1 for 50+ claims

        // Patent status
        risk += match self.patent_status {
            PatentStatus::Pending => 0.4,
            PatentStatus::Granted => 0.0,
            PatentStatus::Reexamination => 0.6,
            PatentStatus::Abandoned | PatentStatus::Expired | PatentStatus::Invalidated => 1.0,
        };

        risk.min(1.0)
    }
}