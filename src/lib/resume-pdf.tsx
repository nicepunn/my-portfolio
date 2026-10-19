import type { ReactNode } from "react";
import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";
import { parseSkillItem, sortSkillsByEmphasis } from "@/lib/skill-emphasis";

const accent = "#0f766e";
const ink = "#111827";
const muted = "#4b5563";
const soft = "#e5e7eb";
const font = "Sarabun";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: font,
    fontWeight: 400,
    color: ink,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 10,
  },
  headerTop: {
    marginBottom: 2,
  },
  nameWrap: {
    paddingBottom: 6,
  },
  name: {
    fontSize: 20,
    fontFamily: font,
    fontWeight: 700,
    color: ink,
    lineHeight: 1.2,
  },
  headlineWrap: {
    paddingBottom: 2,
  },
  headline: {
    fontSize: 10,
    fontFamily: font,
    fontWeight: 700,
    color: accent,
    lineHeight: 1.3,
  },
  accentBar: {
    height: 2.5,
    backgroundColor: accent,
    marginTop: 6,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  contactItem: {
    fontSize: 9,
    color: muted,
  },
  contactSep: {
    fontSize: 9,
    color: soft,
    marginHorizontal: 2,
  },
  summaryBox: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2,
    borderLeftColor: accent,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  summary: {
    fontSize: 9.5,
    color: muted,
    lineHeight: 1.45,
  },
  section: {
    marginTop: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: font,
    fontWeight: 700,
    color: ink,
    borderBottomWidth: 1,
    borderBottomColor: soft,
    paddingBottom: 3,
    marginBottom: 6,
  },
  item: {
    marginBottom: 6,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 1,
  },
  itemTitle: {
    fontFamily: font,
    fontWeight: 700,
    fontSize: 10.5,
    flexGrow: 1,
    flexShrink: 1,
  },
  itemMeta: {
    fontSize: 9,
    color: muted,
    flexShrink: 0,
  },
  itemSubtitle: {
    fontSize: 9.5,
    color: muted,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 2,
  },
  bulletMark: {
    width: 10,
    fontSize: 10,
    color: accent,
  },
  bulletText: {
    flex: 1,
    color: "#374151",
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillLabel: {
    width: 110,
    fontFamily: font,
    fontWeight: 700,
    fontSize: 9.5,
  },
  skillItems: {
    flex: 1,
    color: "#374151",
  },
  skillPrimary: {
    fontFamily: font,
    fontWeight: 700,
    color: ink,
  },
  link: {
    color: accent,
    textDecoration: "none",
  },
});

function SkillItems({ items }: { items: string[] }) {
  const sorted = sortSkillsByEmphasis(items);
  return (
    <Text style={styles.skillItems}>
      {sorted.map((item, index) => {
        const skill = parseSkillItem(item);
        return (
          <Text key={`${skill.label}-${index}`}>
            {index > 0 ? ", " : ""}
            {skill.emphasis === "primary" ? (
              <Text style={styles.skillPrimary}>{skill.label}</Text>
            ) : (
              skill.label
            )}
          </Text>
        );
      })}
    </Text>
  );
}

/** Sections wrap across pages; title stays with the next block of content. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section} wrap>
      <Text style={styles.sectionTitle} minPresenceAhead={56}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Keep a job/project header with at least a bit of body on the same page,
 * but allow the entry to continue onto the next page so we don't leave a
 * large empty gap at the bottom.
 */
function Entry({ children }: { children: ReactNode }) {
  return (
    <View style={styles.item} wrap minPresenceAhead={28}>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ data }: { data: Resume }) {
  return (
    <Document
      title={`${data.name} — Resume`}
      author={data.name}
      subject={data.headline}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <View style={styles.headerTop}>
            <View style={styles.nameWrap}>
              <Text style={styles.name}>{data.name}</Text>
            </View>
            <View style={styles.headlineWrap}>
              <Text style={styles.headline}>{data.headline}</Text>
            </View>
          </View>

          <View style={styles.accentBar} />

          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>{data.location}</Text>
            <Text style={styles.contactSep}>|</Text>
            <Link
              src={`mailto:${data.email}`}
              style={{ ...styles.contactItem, ...styles.link }}
            >
              {data.email}
            </Link>
            <Text style={styles.contactSep}>|</Text>
            <Link
              src={data.github.url}
              style={{ ...styles.contactItem, ...styles.link }}
            >
              github.com/{data.github.label}
            </Link>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        </View>

        <Section title="Education">
          <Entry>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{data.education.degree}</Text>
              <Text style={styles.itemMeta}>{data.education.period}</Text>
            </View>
            <Text style={styles.itemSubtitle}>
              {data.education.school} · GPAX {data.education.gpax}
            </Text>
          </Entry>
        </Section>

        <Section title="Work Experience">
          {data.experience.map((job) => (
            <Entry key={`${job.company}-${job.period}`}>
              <View style={styles.itemHeader} minPresenceAhead={36}>
                <Text style={styles.itemTitle}>{job.company}</Text>
                <Text style={styles.itemMeta}>{job.period}</Text>
              </View>
              <Text style={styles.itemSubtitle}>{job.role}</Text>
              <Bullets items={job.bullets} />
            </Entry>
          ))}
        </Section>

        <Section title="Projects">
          {data.projects.map((project) => (
            <Entry key={project.name}>
              <View style={styles.itemHeader} minPresenceAhead={36}>
                {project.url ? (
                  <Link
                    src={project.url}
                    style={{ ...styles.itemTitle, ...styles.link }}
                  >
                    {project.name}
                  </Link>
                ) : (
                  <Text style={styles.itemTitle}>{project.name}</Text>
                )}
              </View>
              <Text style={styles.itemSubtitle}>{project.stack}</Text>
              <Bullets items={project.description} />
            </Entry>
          ))}
        </Section>

        <Section title="Technical Skills">
          {data.skills.map((group) => (
            <View
              key={group.label}
              style={styles.skillRow}
              wrap={false}
              minPresenceAhead={18}
            >
              <Text style={styles.skillLabel}>{group.label}</Text>
              <SkillItems items={group.items} />
            </View>
          ))}
        </Section>

        <Section title="Activities">
          <Bullets items={data.activities} />
        </Section>

        <Section title="Interests">
          <Text minPresenceAhead={18}>{data.interests.join(" · ")}</Text>
        </Section>
      </Page>
    </Document>
  );
}
