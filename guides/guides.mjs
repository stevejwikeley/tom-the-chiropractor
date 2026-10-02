// The only list of patient guides. Edited here and nowhere else.
//
// send-guide.html renders this, and api/send-guide.mjs checks submitted
// slugs against it, so the two can never disagree about what a guide is
// called or whether it exists.
//
// A guide that belongs to two body areas is defined once and listed in
// both groups. Six of them are, which is why there are 21 guides but 27
// entries in the lists.

export default {
  guides: {
    "low-back-pain": { "title": "Low Back Pain in Your 30s, 40s and 50s" },
    "low-back-pain-over-60": { "title": "Low Back Pain Over 60" },
    "back-pain-and-sciatica": { "title": "Back Pain and Sciatica" },
    "back-pain-and-sciatica-over-60": { "title": "Back Pain and Sciatica Over 60" },
    "back-and-leg-pain": { "title": "Back Pain That Travels Down One Leg" },
    "back-and-leg-pain-when-recovery-slows": { "title": "Back and Leg Pain: When Fast Recovery Slows Down" },
    "back-pain-manual-work": { "title": "Back Pain When You Work With Your Body" },
    "hip-arthritis-and-low-back-pain": { "title": "When Hip Arthritis Starts Costing You Your Back" },
    "neck-and-back-pain-together": { "title": "Neck and Back Pain at the Same Time" },
    "neck-and-back-pain-with-diabetes": { "title": "Neck and Back Pain When You Have Diabetes" },
    "neck-pain": { "title": "Neck Pain in Your 30s, 40s and 50s" },
    "neck-pain-over-60": { "title": "Neck Pain Over 60" },
    "neck-disc-pain-and-arm-symptoms": { "title": "Neck Disc Pain and Arm Symptoms" },
    "neck-pain-after-a-disc-settles": { "title": "Your Neck After a Disc Flare-Up Has Settled" },
    "neck-and-upper-back-pain": { "title": "Mechanical Neck and Upper Back Pain" },
    "headaches-from-the-neck": { "title": "Headaches That Come From the Neck" },
    "upper-back-pain": { "title": "Upper Back Pain in Your 30s, 40s and 50s" },
    "upper-back-pain-over-60": { "title": "Upper Back Pain Over 60" },
    "shoulder-pain": { "title": "Shoulder Pain in Your 30s, 40s and 50s" },
    "shoulder-pain-over-60": { "title": "Shoulder Pain Over 60" },
    "tennis-elbow": { "title": "Tennis Elbow" }
  },
  groups: [
    {
      "heading": "Low back and leg",
      "slugs": [
        "low-back-pain",
        "low-back-pain-over-60",
        "back-pain-and-sciatica",
        "back-pain-and-sciatica-over-60",
        "back-and-leg-pain",
        "back-and-leg-pain-when-recovery-slows",
        "back-pain-manual-work",
        "hip-arthritis-and-low-back-pain",
        "neck-and-back-pain-together",
        "neck-and-back-pain-with-diabetes"
      ]
    },
    {
      "heading": "Neck",
      "slugs": [
        "neck-pain",
        "neck-pain-over-60",
        "neck-disc-pain-and-arm-symptoms",
        "neck-pain-after-a-disc-settles",
        "neck-and-upper-back-pain",
        "headaches-from-the-neck",
        "neck-and-back-pain-together",
        "neck-and-back-pain-with-diabetes"
      ]
    },
    {
      "heading": "Upper back",
      "slugs": [
        "upper-back-pain",
        "upper-back-pain-over-60",
        "neck-and-upper-back-pain"
      ]
    },
    {
      "heading": "Shoulder and arm",
      "slugs": [
        "shoulder-pain",
        "shoulder-pain-over-60",
        "tennis-elbow",
        "neck-disc-pain-and-arm-symptoms"
      ]
    },
    {
      "heading": "Hip",
      "slugs": [
        "hip-arthritis-and-low-back-pain"
      ]
    },
    {
      "heading": "Headaches",
      "slugs": [
        "headaches-from-the-neck"
      ]
    }
  ]
};
